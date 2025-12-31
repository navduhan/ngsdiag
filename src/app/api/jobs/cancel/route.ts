import { NextRequest, NextResponse } from 'next/server';
import { cancelJob } from '@/lib/ssh';

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const success = await cancelJob(jobId);

    return NextResponse.json({
      success,
      message: success ? 'Job cancelled successfully' : 'Failed to cancel job',
    });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
