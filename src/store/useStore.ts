import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Job, ServerConfig, UploadProgress } from '@/types';

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  isLoadingProjects: boolean;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  fetchProjects: () => Promise<void>;
  saveProjectToDb: (project: Omit<Project, 'id'> & { id?: string }) => Promise<Project | null>;

  // Jobs
  jobs: Job[];
  isLoadingJobs: boolean;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  fetchJobs: () => Promise<void>;
  saveJobToDb: (job: Omit<Job, 'id'> & { id?: string }) => Promise<Job | null>;
  updateJobInDb: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJobFromDb: (id: string) => Promise<void>;

  // Upload progress
  uploadProgress: UploadProgress[];
  setUploadProgress: (progress: UploadProgress[]) => void;
  updateUploadProgress: (fileName: string, updates: Partial<UploadProgress>) => void;
  clearUploadProgress: () => void;

  // Server config
  serverConfig: ServerConfig | null;
  setServerConfig: (config: ServerConfig | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Projects
      projects: [],
      currentProject: null,
      isLoadingProjects: false,
      setProjects: (projects) => set({ projects }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      setCurrentProject: (project) => set({ currentProject: project }),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates }
              : state.currentProject,
        })),
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        })),
      fetchProjects: async () => {
        set({ isLoadingProjects: true });
        try {
          const response = await fetch('/api/user/projects');
          const result = await response.json();
          if (result.success && result.projects) {
            const projects = result.projects.map((p: Record<string, unknown>) => ({
              ...p,
              createdAt: new Date(p.createdAt as string),
              updatedAt: new Date(p.updatedAt as string),
            }));
            set({ projects });
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error);
        } finally {
          set({ isLoadingProjects: false });
        }
      },
      saveProjectToDb: async (projectData) => {
        try {
          const response = await fetch('/api/user/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          const result = await response.json();
          if (result.success && result.project) {
            const project = {
              ...result.project,
              createdAt: new Date(result.project.createdAt),
              updatedAt: new Date(result.project.updatedAt),
            };
            get().addProject(project);
            return project;
          }
          return null;
        } catch (error) {
          console.error('Failed to save project:', error);
          return null;
        }
      },

      // Jobs
      jobs: [],
      isLoadingJobs: false,
      setJobs: (jobs) => set({ jobs }),
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, ...updates } : j
          ),
        })),
      deleteJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
        })),
      fetchJobs: async () => {
        set({ isLoadingJobs: true });
        try {
          const response = await fetch('/api/user/jobs');
          const result = await response.json();
          if (result.success && result.jobs) {
            const jobs = result.jobs.map((j: Record<string, unknown>) => ({
              ...j,
              submittedAt: new Date(j.submittedAt as string),
              startedAt: j.startedAt ? new Date(j.startedAt as string) : undefined,
              completedAt: j.completedAt ? new Date(j.completedAt as string) : undefined,
            }));
            set({ jobs });
          }
        } catch (error) {
          console.error('Failed to fetch jobs:', error);
        } finally {
          set({ isLoadingJobs: false });
        }
      },
      saveJobToDb: async (jobData) => {
        try {
          const response = await fetch('/api/user/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData),
          });
          const result = await response.json();
          if (result.success && result.job) {
            const job = {
              ...result.job,
              submittedAt: new Date(result.job.submittedAt),
              startedAt: result.job.startedAt ? new Date(result.job.startedAt) : undefined,
              completedAt: result.job.completedAt ? new Date(result.job.completedAt) : undefined,
            };
            get().addJob(job);
            return job;
          }
          return null;
        } catch (error) {
          console.error('Failed to save job:', error);
          return null;
        }
      },
      updateJobInDb: async (id, updates) => {
        try {
          const response = await fetch('/api/user/jobs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates }),
          });
          const result = await response.json();
          if (result.success) {
            get().updateJob(id, updates);
          }
        } catch (error) {
          console.error('Failed to update job:', error);
        }
      },
      deleteJobFromDb: async (id) => {
        try {
          const response = await fetch(`/api/user/jobs?id=${id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          if (result.success) {
            get().deleteJob(id);
          }
        } catch (error) {
          console.error('Failed to delete job:', error);
        }
      },

      // Upload progress
      uploadProgress: [],
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      updateUploadProgress: (fileName, updates) =>
        set((state) => ({
          uploadProgress: state.uploadProgress.map((p) =>
            p.fileName === fileName ? { ...p, ...updates } : p
          ),
        })),
      clearUploadProgress: () => set({ uploadProgress: [] }),

      // Server config
      serverConfig: null,
      setServerConfig: (config) => set({ serverConfig: config }),

      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'ngsdiag-storage',
      partialize: (state) => ({
        serverConfig: state.serverConfig,
      }),
    }
  )
);
