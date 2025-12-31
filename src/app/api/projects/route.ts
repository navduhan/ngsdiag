import { NextRequest, NextResponse } from 'next/server';
import { createDirectory, fileExists } from '@/lib/storage';

// Retry helper
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { name, path, description } = await request.json();

    if (!name || !path) {
      return NextResponse.json(
        { success: false, error: 'Name and path are required' },
        { status: 400 }
      );
    }

    // Check if directory already exists (with retry)
    const exists = await retryOperation(() => fileExists(path));
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Project directory already exists' },
        { status: 400 }
      );
    }

    // Create project directory structure (with retry)
    await retryOperation(() => createDirectory(path));
    await retryOperation(() => createDirectory(`${path}/raw`));
    await retryOperation(() => createDirectory(`${path}/results`));

    return NextResponse.json({
      success: true,
      data: {
        name,
        path,
        description,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to create project:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for common SSH errors
    if (errorMessage.includes('authentication')) {
      return NextResponse.json(
        { success: false, error: 'SSH authentication failed. Please configure server credentials in Settings or .env.local file.' },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
      return NextResponse.json(
        { success: false, error: 'Cannot connect to server. Please check the server host and port.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create project directory. Check server connection.' },
      { status: 500 }
    );
  }
}
