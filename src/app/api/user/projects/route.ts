import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  createProject, 
  getProjectsByUserId, 
  updateProject as dbUpdateProject, 
  deleteProject as dbDeleteProject,
  getProjectById
} from '@/lib/db';
import { randomUUID } from 'crypto';

// GET - Get all projects for current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projects = getProjectsByUserId(session.userId);
    
    // Transform to frontend format
    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      path: p.path,
      status: p.status,
      description: p.description,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error('Failed to get projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, path, description, status } = await request.json();

    if (!name || !path) {
      return NextResponse.json(
        { success: false, error: 'Name and path are required' },
        { status: 400 }
      );
    }

    const project = createProject({
      id: randomUUID(),
      user_id: session.userId,
      name,
      path,
      status: status || 'created',
      description,
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        path: project.path,
        status: project.status,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
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
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = getProjectById(id);
    if (!existing || existing.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = dbUpdateProject(id, updates);

    return NextResponse.json({
      success: true,
      project: project ? {
        id: project.id,
        name: project.name,
        path: project.path,
        status: project.status,
        description: project.description,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      } : null,
    });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
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
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = getProjectById(id);
    if (!existing || existing.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    dbDeleteProject(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
