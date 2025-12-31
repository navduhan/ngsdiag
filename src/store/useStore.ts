import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, Job, ServerConfig, UploadProgress } from '@/types';

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Jobs
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;

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
    (set) => ({
      // Projects
      projects: [],
      currentProject: null,
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

      // Jobs
      jobs: [],
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
        projects: state.projects,
        jobs: state.jobs,
        serverConfig: state.serverConfig,
      }),
    }
  )
);
