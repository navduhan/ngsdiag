import { NextRequest, NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { jobIds } = await request.json();

    if (!Array.isArray(jobIds)) {
      return NextResponse.json(
        { success: false, error: 'Job IDs array is required' },
        { status: 400 }
      );
    }

    const statuses: Record<string, string> = {};

    for (const jobId of jobIds) {
      if (jobId) {
        statuses[jobId] = await getJobStatus(jobId);
      }
    }

    return NextResponse.json({
      success: true,
      statuses,
    });
  } catch (error) {
    console.error('Failed to get job statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get job statuses' },
      { status: 500 }
    );
  }
}
