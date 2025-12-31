import { NextRequest, NextResponse } from 'next/server';
import { listDirectory } from '@/lib/storage';
import { FileInfo } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Path is required' },
        { status: 400 }
      );
    }

    const list = await listDirectory(path);

    const files: FileInfo[] = list.map((item) => ({
      name: item.filename,
      path: `${path}/${item.filename}`,
      size: item.attrs.size,
      isDirectory: item.attrs.isDirectory(),
      modifiedAt: new Date(item.attrs.mtime * 1000),
    }));

    // Sort: directories first, then by name
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error('Failed to list directory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list directory. Check server connection.' },
      { status: 500 }
    );
  }
}
