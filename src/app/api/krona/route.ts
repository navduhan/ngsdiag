import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Download the Krona HTML file
    const buffer = await downloadFile(path);
    const htmlContent = buffer.toString('utf-8');

    // Return the HTML content
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Failed to load Krona plot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load Krona plot' },
      { status: 500 }
    );
  }
}
