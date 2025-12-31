import { NextRequest, NextResponse } from 'next/server';
import { listDirectory } from '@/lib/storage';
import { getSSHConfig } from '@/lib/ssh';

export async function GET(request: NextRequest) {
  try {
    const config = getSSHConfig();
    const basePath = config.baseProjectPath;

    const list = await listDirectory(basePath);

    // Filter only directories
    const directories = list
      .filter((item) => item.attrs.isDirectory())
      .map((item) => ({
        name: item.filename,
        path: `${basePath}/${item.filename}`,
        modifiedAt: new Date(item.attrs.mtime * 1000),
      }))
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return NextResponse.json({
      success: true,
      basePath,
      directories,
    });
  } catch (error) {
    console.error('Failed to list remote directories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list directories. Check server connection.' },
      { status: 500 }
    );
  }
}
