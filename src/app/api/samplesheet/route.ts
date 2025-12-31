import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { projectPath, content } = await request.json();

    if (!projectPath || !content) {
      return NextResponse.json(
        { success: false, error: 'Project path and content are required' },
        { status: 400 }
      );
    }

    // Save samplesheet to project's raw directory
    const samplesheetPath = `${projectPath}/raw/samplesheet.csv`;
    const buffer = Buffer.from(content, 'utf-8');
    
    await uploadFile(buffer, samplesheetPath);

    return NextResponse.json({
      success: true,
      path: samplesheetPath,
    });
  } catch (error) {
    console.error('Failed to save samplesheet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save samplesheet' },
      { status: 500 }
    );
  }
}
