import { NextRequest, NextResponse } from 'next/server';
import { deleteDirectory } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { path, deleteRemote } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Project path is required' },
        { status: 400 }
      );
    }

    // Optionally delete remote directory
    if (deleteRemote) {
      // Safety check - only allow deletion within the expected base path
      if (!path.includes('/workspace/Diagnostic/')) {
        return NextResponse.json(
          { success: false, error: 'Invalid project path' },
          { status: 400 }
        );
      }

      await deleteDirectory(path);
    }

    return NextResponse.json({
      success: true,
      message: deleteRemote ? 'Project deleted from server' : 'Project removed from list',
    });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
