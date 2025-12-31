/**
 * Storage abstraction layer
 * Supports two modes:
 * 1. SFTP (on-demand) - Makes SSH/SFTP requests for each operation
 * 2. Mount - Uses locally mounted filesystem (e.g., via sshfs)
 * 
 * Configure via environment variables:
 * - STORAGE_MODE: 'sftp' | 'mount' (default: 'sftp')
 * - MOUNT_POINT: Local mount point (e.g., /mnt/hpc)
 * - REMOTE_BASE_PATH: Remote base path that is mounted
 * 
 * Paths are automatically translated between remote and local mount paths.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  listDirectory as sftpListDirectory,
  downloadFile as sftpDownloadFile,
  uploadFile as sftpUploadFile,
  createDirectory as sftpCreateDirectory,
  deleteDirectory as sftpDeleteDirectory,
  fileExists as sftpFileExists,
  executeCommand as sshExecuteCommand,
  submitJob as sshSubmitJob,
  getJobStatus as sshGetJobStatus,
  cancelJob as sshCancelJob,
} from './ssh';

export type StorageMode = 'sftp' | 'mount';

// Get storage mode from environment
export function getStorageMode(): StorageMode {
  const mode = process.env.STORAGE_MODE?.toLowerCase();
  if (mode === 'mount') return 'mount';
  return 'sftp'; // default
}

// Get mount configuration
function getMountConfig() {
  return {
    mountPoint: process.env.MOUNT_POINT || '/mnt/hpc',
    remoteBasePath: process.env.REMOTE_BASE_PATH || '',
  };
}

/**
 * Convert remote path to local mount path
 * e.g., /remote/base/workspace/project -> /mnt/hpc/workspace/project
 */
function toLocalPath(remotePath: string): string {
  const { mountPoint, remoteBasePath } = getMountConfig();
  
  if (remotePath.startsWith(remoteBasePath)) {
    return remotePath.replace(remoteBasePath, mountPoint);
  }
  
  // If path doesn't start with remote base, assume it's already a local path or use as-is
  return remotePath;
}

/**
 * Convert local mount path to remote path (for display/logging)
 * e.g., /mnt/hpc/workspace/project -> /remote/base/workspace/project
 */
function toRemotePath(localPath: string): string {
  const { mountPoint, remoteBasePath } = getMountConfig();
  
  if (localPath.startsWith(mountPoint)) {
    return localPath.replace(mountPoint, remoteBasePath);
  }
  
  return localPath;
}

// File info interface matching what we return from SFTP
export interface FileInfo {
  filename: string;
  attrs: {
    size: number;
    mtime: number;
    isDirectory: () => boolean;
  };
}

/**
 * List directory contents
 */
export async function listDirectory(remotePath: string): Promise<FileInfo[]> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    
    try {
      const entries = await fs.readdir(localPath, { withFileTypes: true });
      const results: FileInfo[] = [];
      
      for (const entry of entries) {
        try {
          const stats = await fs.stat(path.join(localPath, entry.name));
          results.push({
            filename: entry.name,
            attrs: {
              size: stats.size,
              mtime: Math.floor(stats.mtimeMs / 1000),
              isDirectory: () => entry.isDirectory(),
            },
          });
        } catch {
          // Skip files we can't stat
        }
      }
      
      return results;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Directory not found: ${remotePath} (local: ${localPath})`);
      }
      throw error;
    }
  }
  
  // SFTP mode
  return sftpListDirectory(remotePath);
}

/**
 * Download/read file contents
 */
export async function downloadFile(remotePath: string): Promise<Buffer> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    return fs.readFile(localPath);
  }
  
  // SFTP mode
  return sftpDownloadFile(remotePath);
}

/**
 * Upload/write file
 * Note: Signature matches ssh.ts - uploadFile(data, remotePath, onProgress)
 */
export async function uploadFile(
  data: Buffer, 
  remotePath: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, data);
    
    // Call progress callback with completion
    if (onProgress) {
      onProgress(100);
    }
    return;
  }
  
  // SFTP mode
  return sftpUploadFile(data, remotePath, onProgress);
}

/**
 * Create directory
 */
export async function createDirectory(remotePath: string): Promise<void> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    await fs.mkdir(localPath, { recursive: true });
    return;
  }
  
  // SFTP mode
  return sftpCreateDirectory(remotePath);
}

/**
 * Delete directory recursively
 */
export async function deleteDirectory(remotePath: string): Promise<void> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    await fs.rm(localPath, { recursive: true, force: true });
    return;
  }
  
  // SFTP mode
  return sftpDeleteDirectory(remotePath);
}

/**
 * Check if file/directory exists
 */
export async function fileExists(remotePath: string): Promise<boolean> {
  const mode = getStorageMode();
  
  if (mode === 'mount') {
    const localPath = toLocalPath(remotePath);
    try {
      await fs.access(localPath);
      return true;
    } catch {
      return false;
    }
  }
  
  // SFTP mode
  return sftpFileExists(remotePath);
}

/**
 * Write text content to file
 */
export async function writeFile(remotePath: string, content: string): Promise<void> {
  return uploadFile(Buffer.from(content, 'utf-8'), remotePath);
}

/**
 * Read text content from file
 */
export async function readFile(remotePath: string): Promise<string> {
  const buffer = await downloadFile(remotePath);
  return buffer.toString('utf-8');
}

// Re-export SSH-only functions (these always use SSH regardless of storage mode)
// These are for job execution which requires SSH
export { 
  sshExecuteCommand as executeCommand,
  sshSubmitJob as submitJob,
  sshGetJobStatus as getJobStatus,
  sshCancelJob as cancelJob,
};

// Export storage info for debugging/status
export function getStorageInfo(): {
  mode: StorageMode;
  mountPoint: string;
  remoteBasePath: string;
} {
  const config = getMountConfig();
  return {
    mode: getStorageMode(),
    mountPoint: config.mountPoint,
    remoteBasePath: config.remoteBasePath,
  };
}

// Export path conversion utilities
export { toLocalPath, toRemotePath };
