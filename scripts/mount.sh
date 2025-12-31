#!/bin/bash

# NGSDiag Mount Script
# Mounts the remote HPC filesystem using sshfs

set -e

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (must be set in .env.local)
MOUNT_POINT="${MOUNT_POINT:-/mnt/hpc}"
SSH_HOST="${SSH_HOST:-}"
SSH_USER="${SSH_USERNAME:-}"
SSH_PORT="${SSH_PORT:-22}"
REMOTE_PATH="${REMOTE_BASE_PATH:-}"

# Validate required variables
if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ] || [ -z "$REMOTE_PATH" ]; then
    echo -e "${RED}Error: Missing required configuration${NC}"
    echo "Please set the following in .env.local:"
    echo "  SSH_HOST=your-server.edu"
    echo "  SSH_USERNAME=your-username"
    echo "  REMOTE_BASE_PATH=/path/on/remote/server"
    exit 1
fi

# For sshfs, we need to escape or quote usernames with @ symbols
SSHFS_USER_HOST="${SSH_USER}@${SSH_HOST}"

echo -e "${GREEN}NGSDiag SSHFS Mount Utility${NC}"
echo "=================================="

# Check if sshfs is installed
if ! command -v sshfs &> /dev/null; then
    echo -e "${RED}Error: sshfs is not installed${NC}"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt install sshfs"
    echo "  Fedora/RHEL:   sudo dnf install fuse-sshfs"
    echo "  Arch:          sudo pacman -S sshfs"
    exit 1
fi

# Function to check if mounted
is_mounted() {
    mount | grep -q "$MOUNT_POINT"
}

# Function to mount
do_mount() {
    echo -e "${YELLOW}Mounting ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}${NC}"
    echo -e "${YELLOW}To: ${MOUNT_POINT}${NC}"
    
    # Create mount point if it doesn't exist
    if [ ! -d "$MOUNT_POINT" ]; then
        echo "Creating mount point directory..."
        sudo mkdir -p "$MOUNT_POINT"
        sudo chown $USER:$USER "$MOUNT_POINT"
    fi
    
    # Check if already mounted
    if is_mounted; then
        echo -e "${GREEN}Already mounted!${NC}"
        return 0
    fi
    
    # Mount with sshfs
    echo "Running: sshfs ${SSHFS_USER_HOST}:${REMOTE_PATH} $MOUNT_POINT"
    sshfs "${SSHFS_USER_HOST}:${REMOTE_PATH}" "$MOUNT_POINT" \
        -o reconnect \
        -o ServerAliveInterval=15 \
        -o ServerAliveCountMax=3 \
        -o Port=${SSH_PORT}
    
    if is_mounted; then
        echo -e "${GREEN}Successfully mounted!${NC}"
        echo ""
        echo "You can now use mount mode. Update your .env.local:"
        echo "  STORAGE_MODE=mount"
        echo "  BASE_PROJECT_PATH=${MOUNT_POINT}/workspace/Diagnostic"
        echo "  PIPELINE_PATH=${MOUNT_POINT}/softwares/ngsdiag-pipeline"
    else
        echo -e "${RED}Mount failed!${NC}"
        exit 1
    fi
}

# Function to unmount
do_unmount() {
    echo -e "${YELLOW}Unmounting ${MOUNT_POINT}${NC}"
    
    if ! is_mounted; then
        echo "Not mounted"
        return 0
    fi
    
    fusermount -u "$MOUNT_POINT" 2>/dev/null || umount "$MOUNT_POINT"
    
    if ! is_mounted; then
        echo -e "${GREEN}Successfully unmounted!${NC}"
    else
        echo -e "${RED}Unmount failed!${NC}"
        exit 1
    fi
}

# Function to show status
show_status() {
    echo "Configuration:"
    echo "  SSH Host:     $SSH_HOST"
    echo "  SSH User:     $SSH_USER"
    echo "  SSH Port:     $SSH_PORT"
    echo "  Remote Path:  $REMOTE_PATH"
    echo "  Mount Point:  $MOUNT_POINT"
    echo ""
    
    if is_mounted; then
        echo -e "Status: ${GREEN}MOUNTED${NC}"
        df -h "$MOUNT_POINT" 2>/dev/null || true
    else
        echo -e "Status: ${RED}NOT MOUNTED${NC}"
    fi
}

# Main
case "${1:-status}" in
    mount)
        do_mount
        ;;
    unmount|umount)
        do_unmount
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {mount|unmount|status}"
        echo ""
        echo "Commands:"
        echo "  mount    - Mount the remote filesystem"
        echo "  unmount  - Unmount the filesystem"
        echo "  status   - Show current mount status"
        exit 1
        ;;
esac
