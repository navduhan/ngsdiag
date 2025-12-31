import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createJob, 
  getJobsByUserId, 
  getRecentJobs,
  updateJob as dbUpdateJob, 
  deleteJob as dbDeleteJob,
  getJobById
} from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Get all jobs for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const recent = searchParams.get('recent');

    let jobs;
    if (recent === 'true' && limit) {
      jobs = getRecentJobs(session.userId, parseInt(limit));
    } else {
      jobs = getJobsByUserId(session.userId);
    }
    
    // Transform to frontend format
    const formattedJobs = jobs.map(j => ({
      id: j.id,
      projectId: j.project_id,
      projectName: j.project_name,
      status: j.status,
      command: j.command,
      schedulerJobId: j.scheduler_job_id,
      submittedAt: j.submitted_at,
      startedAt: j.started_at,
      completedAt: j.completed_at,
      error: j.error,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('Failed to get jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get jobs' },
      { status: 500 }
    );
  }
}

// POST - Create a new job
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId, projectName, command, schedulerJobId, status } = await request.json();

    if (!projectId || !projectName) {
      return NextResponse.json(
        { success: false, error: 'Project ID and name are required' },
        { status: 400 }
      );
    }

    const job = createJob({
      id: randomUUID(),
      user_id: session.userId,
      project_id: projectId,
      project_name: projectName,
      status: status || 'queued',
      command,
      scheduler_job_id: schedulerJobId,
      submitted_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        projectId: job.project_id,
        projectName: job.project_name,
        status: job.status,
        command: job.command,
        schedulerJobId: job.scheduler_job_id,
        submittedAt: job.submitted_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
      },
    });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

// PUT - Update a job
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = getJobById(id);
    if (!existing || existing.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Map frontend field names to database field names
    const dbUpdates: Record<string, unknown> = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.command !== undefined) dbUpdates.command = updates.command;
    if (updates.schedulerJobId !== undefined) dbUpdates.scheduler_job_id = updates.schedulerJobId;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.error !== undefined) dbUpdates.error = updates.error;

    const job = dbUpdateJob(id, dbUpdates);

    return NextResponse.json({
      success: true,
      job: job ? {
        id: job.id,
        projectId: job.project_id,
        projectName: job.project_name,
        status: job.status,
        command: job.command,
        schedulerJobId: job.scheduler_job_id,
        submittedAt: job.submitted_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        error: job.error,
      } : null,
    });
  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = getJobById(id);
    if (!existing || existing.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    dbDeleteJob(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
