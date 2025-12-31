import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file location
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'ngsdiag.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
const initSchema = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      command TEXT,
      scheduler_job_id TEXT,
      submitted_at DATETIME NOT NULL,
      started_at DATETIME,
      completed_at DATETIME,
      error TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  `);
};

// Initialize on first import
initSchema();

// ============ User Operations ============

export interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface CreateUserInput {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

export const createUser = (input: CreateUserInput): DbUser => {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (@id, @email, @name, @password_hash)
  `);
  stmt.run(input);
  return getUserById(input.id)!;
};

export const getUserByEmail = (email: string): DbUser | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as DbUser | undefined;
};

export const getUserById = (id: string): DbUser | undefined => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as DbUser | undefined;
};

// ============ Project Operations ============

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  path: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  id: string;
  user_id: string;
  name: string;
  path: string;
  status?: string;
  description?: string;
}

export const createProject = (input: CreateProjectInput): DbProject => {
  const stmt = db.prepare(`
    INSERT INTO projects (id, user_id, name, path, status, description)
    VALUES (@id, @user_id, @name, @path, @status, @description)
  `);
  stmt.run({
    ...input,
    status: input.status || 'created',
    description: input.description || null,
  });
  return getProjectById(input.id)!;
};

export const getProjectById = (id: string): DbProject | undefined => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as DbProject | undefined;
};

export const getProjectsByUserId = (userId: string): DbProject[] => {
  const stmt = db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as DbProject[];
};

export const updateProject = (id: string, updates: Partial<Omit<DbProject, 'id' | 'user_id' | 'created_at'>>): DbProject | undefined => {
  const fields: string[] = [];
  const values: Record<string, unknown> = { id };

  if (updates.name !== undefined) {
    fields.push('name = @name');
    values.name = updates.name;
  }
  if (updates.path !== undefined) {
    fields.push('path = @path');
    values.path = updates.path;
  }
  if (updates.status !== undefined) {
    fields.push('status = @status');
    values.status = updates.status;
  }
  if (updates.description !== undefined) {
    fields.push('description = @description');
    values.description = updates.description;
  }

  if (fields.length === 0) return getProjectById(id);

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = @id`);
  stmt.run(values);
  return getProjectById(id);
};

export const deleteProject = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

// ============ Job Operations ============

export interface DbJob {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  status: string;
  command: string | null;
  scheduler_job_id: string | null;
  submitted_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface CreateJobInput {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  status?: string;
  command?: string;
  scheduler_job_id?: string;
  submitted_at: string;
}

export const createJob = (input: CreateJobInput): DbJob => {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, user_id, project_id, project_name, status, command, scheduler_job_id, submitted_at)
    VALUES (@id, @user_id, @project_id, @project_name, @status, @command, @scheduler_job_id, @submitted_at)
  `);
  stmt.run({
    ...input,
    status: input.status || 'queued',
    command: input.command || null,
    scheduler_job_id: input.scheduler_job_id || null,
  });
  return getJobById(input.id)!;
};

export const getJobById = (id: string): DbJob | undefined => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
  return stmt.get(id) as DbJob | undefined;
};

export const getJobsByUserId = (userId: string): DbJob[] => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY submitted_at DESC');
  return stmt.all(userId) as DbJob[];
};

export const getJobsByProjectId = (projectId: string): DbJob[] => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE project_id = ? ORDER BY submitted_at DESC');
  return stmt.all(projectId) as DbJob[];
};

export const getRecentJobs = (userId: string, limit: number = 10): DbJob[] => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE user_id = ? ORDER BY submitted_at DESC LIMIT ?');
  return stmt.all(userId, limit) as DbJob[];
};

export const updateJob = (id: string, updates: Partial<Omit<DbJob, 'id' | 'user_id' | 'project_id' | 'project_name' | 'submitted_at'>>): DbJob | undefined => {
  const fields: string[] = [];
  const values: Record<string, unknown> = { id };

  if (updates.status !== undefined) {
    fields.push('status = @status');
    values.status = updates.status;
  }
  if (updates.command !== undefined) {
    fields.push('command = @command');
    values.command = updates.command;
  }
  if (updates.scheduler_job_id !== undefined) {
    fields.push('scheduler_job_id = @scheduler_job_id');
    values.scheduler_job_id = updates.scheduler_job_id;
  }
  if (updates.started_at !== undefined) {
    fields.push('started_at = @started_at');
    values.started_at = updates.started_at;
  }
  if (updates.completed_at !== undefined) {
    fields.push('completed_at = @completed_at');
    values.completed_at = updates.completed_at;
  }
  if (updates.error !== undefined) {
    fields.push('error = @error');
    values.error = updates.error;
  }

  if (fields.length === 0) return getJobById(id);

  const stmt = db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = @id`);
  stmt.run(values);
  return getJobById(id);
};

export const deleteJob = (id: string): boolean => {
  const stmt = db.prepare('DELETE FROM jobs WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

export default db;
