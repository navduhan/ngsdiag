import type { Client, SFTPWrapper } from 'ssh2';
import { ServerConfig } from '@/types';

// Dynamic import for ssh2 to avoid Turbopack issues
let SSH2Client: typeof Client | null = null;

async function getSSH2Client(): Promise<typeof Client> {
  if (!SSH2Client) {
    const ssh2 = await import('ssh2');
    SSH2Client = ssh2.Client;
  }
  return SSH2Client;
}

// Default config - in production, this should come from environment variables or secure storage
const defaultConfig: ServerConfig = {
  host: process.env.SSH_HOST || 'localhost',
  port: parseInt(process.env.SSH_PORT || '22'),
  username: process.env.SSH_USERNAME || 'user',
  password: process.env.SSH_PASSWORD,
  privateKey: process.env.SSH_PRIVATE_KEY,
  pipelinePath: process.env.PIPELINE_PATH || '',
  baseProjectPath: process.env.BASE_PROJECT_PATH || '',
};

export function getSSHConfig(): ServerConfig {
  return defaultConfig;
}

export async function createSSHConnection(): Promise<Client> {
  const config = getSSHConfig();
  const ClientClass = await getSSH2Client();
  
  console.log('SSH connecting to:', config.host, 'as', config.username);
  
  return new Promise((resolve, reject) => {
    const conn = new ClientClass();
    
    // Timeout handler
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error('Connection timeout - server took too long to respond'));
    }, 30000);
    
    conn.on('ready', () => {
      clearTimeout(timeout);
      resolve(conn);
    });
    
    conn.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    const connectConfig: Record<string, unknown> = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: 30000,
      keepaliveInterval: 10000,
    };
    
    if (config.privateKey) {
      connectConfig.privateKey = config.privateKey;
    } else if (config.password) {
      connectConfig.password = config.password;
    }
    
    conn.connect(connectConfig);
  });
}

export async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
  const conn = await createSSHConnection();
  
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) {
        conn.end();
        reject(err);
        return;
      }
      
      let stdout = '';
      let stderr = '';
      
      stream.on('close', () => {
        conn.end();
        resolve({ stdout, stderr });
      });
      
      stream.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      
      stream.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    });
  });
}

export async function createDirectory(path: string): Promise<void> {
  await executeCommand(`mkdir -p "${path}"`);
}

export async function getSFTPConnection(): Promise<{ conn: Client; sftp: SFTPWrapper }> {
  const conn = await createSSHConnection();
  
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        reject(err);
        return;
      }
      resolve({ conn, sftp });
    });
  });
}

export async function listDirectory(path: string): Promise<Array<{
  filename: string;
  longname: string;
  attrs: {
    size: number;
    mtime: number;
    isDirectory: () => boolean;
  };
}>> {
  const { conn, sftp } = await getSFTPConnection();
  
  return new Promise((resolve, reject) => {
    sftp.readdir(path, (err, list) => {
      conn.end();
      
      if (err) {
        reject(err);
        return;
      }
      
      resolve(list);
    });
  });
}

export async function uploadFile(
  localContent: Buffer,
  remotePath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const { conn, sftp } = await getSFTPConnection();
  
  return new Promise((resolve, reject) => {
    const writeStream = sftp.createWriteStream(remotePath);
    
    writeStream.on('close', () => {
      conn.end();
      resolve();
    });
    
    writeStream.on('error', (err: Error) => {
      conn.end();
      reject(err);
    });
    
    // Write the buffer
    writeStream.end(localContent);
  });
}

export async function downloadFile(remotePath: string): Promise<Buffer> {
  const { conn, sftp } = await getSFTPConnection();
  
  return new Promise((resolve, reject) => {
    sftp.readFile(remotePath, (err, data) => {
      conn.end();
      
      if (err) {
        reject(err);
        return;
      }
      
      resolve(data);
    });
  });
}

export async function fileExists(path: string): Promise<boolean> {
  const { conn, sftp } = await getSFTPConnection();
  
  return new Promise((resolve) => {
    sftp.stat(path, (err) => {
      conn.end();
      resolve(!err);
    });
  });
}

export async function deleteDirectory(remotePath: string): Promise<void> {
  // Use rm -rf via SSH for recursive deletion
  const { stderr } = await executeCommand(`rm -rf "${remotePath}"`);
  
  if (stderr && stderr.includes('Permission denied')) {
    throw new Error(`Permission denied: Cannot delete ${remotePath}`);
  }
}

export async function submitJob(
  projectPath: string,
  command: string
): Promise<{ jobId: string; output: string }> {
  // Create a unique job ID based on timestamp
  const jobId = Date.now().toString();
  const logFile = `${projectPath}/ngsdiag_${jobId}.log`;
  const pidFile = `${projectPath}/ngsdiag_${jobId}.pid`;
  const cmdFile = `${projectPath}/ngsdiag_${jobId}.cmd`;
  const errFile = `${projectPath}/ngsdiag_${jobId}.err`;
  const runScript = `${projectPath}/ngsdiag_${jobId}.sh`;
  
  // First, save the command to a file for debugging
  const timestamp = new Date().toISOString();
  const cmdContent = `# NGSDiag Pipeline Command
# Job ID: ${jobId}
# Submitted: ${timestamp}
# Project: ${projectPath}

# Command:
${command}

# To run manually:
# cd "${projectPath}" && bash ngsdiag_${jobId}.sh
`;
  
  await executeCommand(`cat > "${cmdFile}" << 'NGSDIAG_CMD_EOF'
${cmdContent}
NGSDIAG_CMD_EOF`);

  // Create a shell script that handles everything
  const scriptContent = `#!/bin/bash
# NGSDiag Runner Script
# Job ID: ${jobId}

# Source system-wide profile for proper PATH setup
if [ -f /etc/profile ]; then
    source /etc/profile
fi

# Source user profile
if [ -f ~/.bash_profile ]; then
    source ~/.bash_profile
elif [ -f ~/.profile ]; then
    source ~/.profile
fi
source ~/.bashrc

# Load SLURM module if module system is available
if command -v module &> /dev/null; then
    module load slurm 2>/dev/null || true
    module load scheduler 2>/dev/null || true
fi

# Add common SLURM paths if sbatch still not found
if ! command -v sbatch &> /dev/null; then
    export PATH="/usr/local/slurm/bin:/opt/slurm/bin:/usr/bin:$PATH"
fi

# Initialize conda
if [ -f ~/miniconda3/etc/profile.d/conda.sh ]; then
    source ~/miniconda3/etc/profile.d/conda.sh
elif [ -f ~/anaconda3/etc/profile.d/conda.sh ]; then
    source ~/anaconda3/etc/profile.d/conda.sh
elif [ -f /opt/conda/etc/profile.d/conda.sh ]; then
    source /opt/conda/etc/profile.d/conda.sh
fi

# Activate environment
conda activate metanextviro

# Change to project directory
cd "${projectPath}"

# Log start time
echo "=== NGSDiag Pipeline Started ===" >> "${logFile}"
echo "Job ID: ${jobId}" >> "${logFile}"
echo "Start Time: $(date)" >> "${logFile}"
echo "Working Directory: $(pwd)" >> "${logFile}"
echo "Conda Environment: \$CONDA_DEFAULT_ENV" >> "${logFile}"
echo "sbatch location: $(which sbatch 2>/dev/null || echo 'NOT FOUND')" >> "${logFile}"
echo "PATH: \$PATH" >> "${logFile}"
echo "================================" >> "${logFile}"
echo "" >> "${logFile}"

# Run the command
${command} >> "${logFile}" 2>&1
EXIT_CODE=\$?

# Log end time
echo "" >> "${logFile}"
echo "================================" >> "${logFile}"
echo "End Time: $(date)" >> "${logFile}"
echo "Exit Code: \$EXIT_CODE" >> "${logFile}"

exit \$EXIT_CODE
`;

  await executeCommand(`cat > "${runScript}" << 'NGSDIAG_SCRIPT_EOF'
${scriptContent}
NGSDIAG_SCRIPT_EOF`);
  
  // Make script executable
  await executeCommand(`chmod +x "${runScript}"`);
  
  // Create a launcher script that properly detaches the process
  const launcherScript = `${projectPath}/ngsdiag_${jobId}_launcher.sh`;
  const launcherContent = `#!/bin/bash
# Launcher script that properly detaches the main script
cd "${projectPath}"
nohup bash "${runScript}" </dev/null >/dev/null 2>"${errFile}" &
PID=$!
echo $PID > "${pidFile}"
disown $PID 2>/dev/null || true
echo $PID
`;

  await executeCommand(`cat > "${launcherScript}" << 'NGSDIAG_LAUNCHER_EOF'
${launcherContent}
NGSDIAG_LAUNCHER_EOF`);
  
  await executeCommand(`chmod +x "${launcherScript}"`);
  
  // Run the launcher script
  const { stdout, stderr } = await executeCommand(`bash "${launcherScript}"`);
  
  // Wait a moment for process to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check for immediate errors
  const { stdout: errContent } = await executeCommand(`cat "${errFile}" 2>/dev/null || echo ""`);
  
  // Check if PID is valid and process is running
  const { stdout: pidContent } = await executeCommand(`cat "${pidFile}" 2>/dev/null || echo ""`);
  const pid = pidContent.trim();
  
  let processStatus = '';
  if (pid) {
    const { stdout: psOutput } = await executeCommand(`ps -p ${pid} -o pid= 2>/dev/null || echo "not running"`);
    processStatus = psOutput.includes(pid) ? 'Process running' : 'Process may have exited';
  }
  
  return {
    jobId,
    output: `PID: ${pid}\n${processStatus}\n${stdout}${stderr}${errContent ? `\nErrors: ${errContent}` : ''}`,
  };
}

export async function getJobStatus(jobId: string): Promise<string> {
  try {
    // This jobId might be a SLURM job ID or our custom job ID
    // First, try to check if it's a running process (our custom job ID)
    const baseProjectPath = process.env.BASE_PROJECT_PATH || '';
    
    // Try to find the pid file in any project directory
    const { stdout: findPid } = await executeCommand(
      `find ${baseProjectPath} -name "ngsdiag_${jobId}.pid" 2>/dev/null | head -1`
    );
    
    const pidFile = findPid.trim();
    
    if (pidFile) {
      // Found our custom job, check if process is still running
      const { stdout: pidContent } = await executeCommand(`cat "${pidFile}" 2>/dev/null`);
      const pid = pidContent.trim();
      
      if (pid) {
        // Check if process is still running
        const { stdout: psCheck } = await executeCommand(`ps -p ${pid} -o pid= 2>/dev/null`);
        
        if (psCheck.trim()) {
          return 'running';
        } else {
          // Process finished, check the log for success/failure
          const logFile = pidFile.replace('.pid', '.log');
          const { stdout: logTail } = await executeCommand(`tail -50 "${logFile}" 2>/dev/null`);
          
          if (logTail.includes('Pipeline completed successfully') || 
              logTail.includes('Succeeded') ||
              logTail.includes('Workflow finished')) {
            return 'completed';
          } else if (logTail.includes('Error') || 
                     logTail.includes('FAILED') ||
                     logTail.includes('error')) {
            return 'failed';
          }
          
          // Default to completed if process ended without clear error
          return 'completed';
        }
      }
    }
    
    // If not found as custom job, try SLURM
    const { stdout } = await executeCommand(`squeue -j ${jobId} -h -o "%T" 2>/dev/null || echo "UNKNOWN"`);
    const status = stdout.trim();
    
    if (status === 'PENDING') return 'queued';
    if (status === 'RUNNING') return 'running';
    if (status === 'COMPLETED') return 'completed';
    if (status === 'FAILED' || status === 'CANCELLED') return 'failed';
    if (status === 'UNKNOWN' || !status) {
      // Job might have completed, check sacct
      const { stdout: acctOutput } = await executeCommand(
        `sacct -j ${jobId} -n -o State --parsable2 2>/dev/null | head -1`
      );
      const acctStatus = acctOutput.trim();
      
      if (acctStatus === 'COMPLETED') return 'completed';
      if (acctStatus === 'FAILED' || acctStatus === 'CANCELLED' || acctStatus === 'TIMEOUT') return 'failed';
    }
    
    // Unknown status - might be completed or not a valid job
    return 'completed';
  } catch (error) {
    console.error('Error checking job status:', error);
    return 'running';
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    await executeCommand(`scancel ${jobId}`);
    return true;
  } catch {
    return false;
  }
}
