import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, createDirectory } from '@/lib/storage';

// Configure route to handle large files (up to 50GB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50gb',
    },
    responseLimit: false,
  },
};

// Increase max duration for large file uploads (5 minutes)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectPath = formData.get('projectPath') as string;

    if (!file || !projectPath) {
      return NextResponse.json(
        { success: false, error: 'File and project path are required' },
        { status: 400 }
      );
    }

    // Validate file extension
    const validExtensions = ['.fastq', '.fq', '.fastq.gz', '.fq.gz'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only FASTQ files are allowed.' },
        { status: 400 }
      );
    }

    // Ensure the raw directory exists
    await createDirectory(projectPath);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const remotePath = `${projectPath}/${file.name}`;
    await uploadFile(buffer, remotePath);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        path: remotePath,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file. Check server connection.' },
      { status: 500 }
    );
  }
}
