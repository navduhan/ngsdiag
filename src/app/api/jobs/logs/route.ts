import { NextRequest, NextResponse } from 'next/server';
import { executeCommand } from '@/lib/ssh';

export async function POST(request: NextRequest) {
  try {
    const { jobId, projectPath } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const baseProjectPath = process.env.BASE_PROJECT_PATH || '';
    let logContent = '';
    let pidContent = '';
    let status = 'unknown';

    // Try to find log file
    let logFile = '';
    if (projectPath) {
      logFile = `${projectPath}/ngsdiag_${jobId}.log`;
    } else {
      // Search for log file
      const { stdout: findLog } = await executeCommand(
        `find ${baseProjectPath} -name "ngsdiag_${jobId}.log" 2>/dev/null | head -1`
      );
      logFile = findLog.trim();
    }

    if (logFile) {
      // Get log content (last 200 lines)
      const { stdout: logTail } = await executeCommand(`tail -200 "${logFile}" 2>/dev/null`);
      logContent = logTail;

      // Check PID file
      const pidFile = logFile.replace('.log', '.pid');
      const { stdout: pid } = await executeCommand(`cat "${pidFile}" 2>/dev/null`);
      pidContent = pid.trim();

      if (pidContent) {
        // Check if process is running
        const { stdout: psCheck } = await executeCommand(`ps -p ${pidContent} -o pid= 2>/dev/null`);
        if (psCheck.trim()) {
          status = 'running';
        } else {
          // Process ended, check log for status
          if (logContent.includes('Pipeline completed successfully') || 
              logContent.includes('Succeeded') ||
              logContent.includes('Workflow finished')) {
            status = 'completed';
          } else if (logContent.includes('Error') || 
                     logContent.includes('FAILED')) {
            status = 'failed';
          } else {
            status = 'completed';
          }
        }
      }
    }

    // Also check for .nextflow.log in project directory
    let nextflowLog = '';
    if (projectPath) {
      const { stdout: nfLog } = await executeCommand(`tail -100 "${projectPath}/.nextflow.log" 2>/dev/null`);
      nextflowLog = nfLog;
    }

    return NextResponse.json({
      success: true,
      jobId,
      status,
      pid: pidContent,
      log: logContent,
      nextflowLog,
      logFile,
    });
  } catch (error) {
    console.error('Failed to get job logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get job logs' },
      { status: 500 }
    );
  }
}
