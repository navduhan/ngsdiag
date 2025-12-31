/**
 * SSHFS Mount Utility
 * Automatically mounts remote filesystem when STORAGE_MODE=mount
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface MountConfig {
  enabled: boolean;
  localMountPoint: string;
  remoteHost: string;
  remoteUser: string;
  remotePath: string;
  sshKeyPath?: string;
  sshPort?: number;
}

// Get mount configuration from environment
export function getMountConfig(): MountConfig {
  const storageMode = process.env.STORAGE_MODE?.toLowerCase();
  
  return {
    enabled: storageMode === 'mount' && process.env.AUTO_MOUNT === 'true',
    localMountPoint: process.env.MOUNT_POINT || '/mnt/hpc',
    remoteHost: process.env.SSH_HOST || '',
    remoteUser: process.env.SSH_USERNAME || '',
    remotePath: process.env.REMOTE_BASE_PATH || '',
    sshKeyPath: process.env.SSH_KEY_PATH,
    sshPort: parseInt(process.env.SSH_PORT || '22'),
  };
}

/**
 * Check if a path is already mounted
 */
export async function isMounted(mountPoint: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('mount');
    return stdout.includes(mountPoint);
  } catch {
    return false;
  }
}

/**
 * Check if sshfs is installed
 */
export async function isSshfsInstalled(): Promise<boolean> {
  try {
    await execAsync('which sshfs');
    return true;
  } catch {
    return false;
  }
}

/**
 * Create mount point directory if it doesn't exist
 */
export async function ensureMountPoint(mountPoint: string): Promise<void> {
  try {
    await fs.mkdir(mountPoint, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Mount remote filesystem using sshfs
 */
export async function mountRemote(config?: Partial<MountConfig>): Promise<{ success: boolean; message: string }> {
  const fullConfig = { ...getMountConfig(), ...config };
  
  const { localMountPoint, remoteHost, remoteUser, remotePath, sshKeyPath, sshPort } = fullConfig;
  
  if (!remoteHost || !remoteUser) {
    return { success: false, message: 'SSH host and username are required for mounting' };
  }
  
  // Check if sshfs is installed
  const hasSshfs = await isSshfsInstalled();
  if (!hasSshfs) {
    return { 
      success: false, 
      message: 'sshfs is not installed. Install it with: sudo apt install sshfs (Ubuntu) or sudo dnf install fuse-sshfs (Fedora)' 
    };
  }
  
  // Check if already mounted
  const alreadyMounted = await isMounted(localMountPoint);
  if (alreadyMounted) {
    return { success: true, message: `Already mounted at ${localMountPoint}` };
  }
  
  // Ensure mount point exists
  try {
    await ensureMountPoint(localMountPoint);
  } catch (error: any) {
    return { success: false, message: `Failed to create mount point: ${error.message}` };
  }
  
  // Build sshfs command
  let sshfsCmd = `sshfs ${remoteUser}@${remoteHost}:${remotePath} ${localMountPoint}`;
  
  // Add options
  const options: string[] = [
    '-o reconnect',           // Auto-reconnect on connection drop
    '-o ServerAliveInterval=15', // Keep connection alive
    '-o ServerAliveCountMax=3',
    `-o Port=${sshPort}`,
  ];
  
  if (sshKeyPath) {
    options.push(`-o IdentityFile=${sshKeyPath}`);
  }
  
  sshfsCmd += ' ' + options.join(' ');
  
  try {
    await execAsync(sshfsCmd);
    return { success: true, message: `Successfully mounted ${remoteHost}:${remotePath} at ${localMountPoint}` };
  } catch (error: any) {
    return { success: false, message: `Failed to mount: ${error.message}` };
  }
}

/**
 * Unmount filesystem
 */
export async function unmountRemote(mountPoint?: string): Promise<{ success: boolean; message: string }> {
  const mp = mountPoint || getMountConfig().localMountPoint;
  
  const mounted = await isMounted(mp);
  if (!mounted) {
    return { success: true, message: 'Not mounted' };
  }
  
  try {
    // Try fusermount first (preferred for FUSE mounts)
    await execAsync(`fusermount -u ${mp}`);
    return { success: true, message: `Successfully unmounted ${mp}` };
  } catch {
    try {
      // Fallback to regular umount
      await execAsync(`umount ${mp}`);
      return { success: true, message: `Successfully unmounted ${mp}` };
    } catch (error: any) {
      return { success: false, message: `Failed to unmount: ${error.message}` };
    }
  }
}

/**
 * Get mount status
 */
export async function getMountStatus(): Promise<{
  mode: string;
  autoMount: boolean;
  isMounted: boolean;
  mountPoint: string;
  sshfsInstalled: boolean;
}> {
  const config = getMountConfig();
  const [mounted, hasSshfs] = await Promise.all([
    isMounted(config.localMountPoint),
    isSshfsInstalled(),
  ]);
  
  return {
    mode: process.env.STORAGE_MODE || 'sftp',
    autoMount: config.enabled,
    isMounted: mounted,
    mountPoint: config.localMountPoint,
    sshfsInstalled: hasSshfs,
  };
}

/**
 * Auto-mount if configured
 * Call this at app startup
 */
export async function autoMountIfEnabled(): Promise<void> {
  const config = getMountConfig();
  
  if (!config.enabled) {
    return;
  }
  
  console.log('[Mount] Auto-mount is enabled, attempting to mount...');
  const result = await mountRemote();
  
  if (result.success) {
    console.log(`[Mount] ${result.message}`);
  } else {
    console.error(`[Mount] ${result.message}`);
  }
}
