'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, generateId } from '@/lib/utils';
import { 
  FolderPlus, 
  Search, 
  Trash2, 
  Upload,
  Settings2,
  Eye,
  FolderOpen,
  Download,
  RefreshCw,
  FolderInput
} from 'lucide-react';
import { Project, ProjectStatus } from '@/types';

const statusVariants: Record<ProjectStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  created: 'default',
  uploading: 'info',
  ready: 'success',
  running: 'warning',
  completed: 'success',
  failed: 'error',
};

interface RemoteDirectory {
  name: string;
  path: string;
  modifiedAt: Date;
}

export default function ProjectsPage() {
  const { projects, deleteProject, addProject } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteFromServer, setDeleteFromServer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Import state
  const [remoteDirectories, setRemoteDirectories] = useState<RemoteDirectory[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [manualDirName, setManualDirName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteFromServer(false);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);

    try {
      if (deleteFromServer) {
        const response = await fetch('/api/projects/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            path: projectToDelete.path,
            deleteRemote: true 
          }),
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error);
        }
      }
      
      deleteProject(projectToDelete.id);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadRemoteDirectories = async () => {
    setIsLoadingRemote(true);
    setImportError(null);
    
    try {
      const response = await fetch('/api/projects/list-remote');
      const result = await response.json();
      
      if (result.success) {
        // Filter out directories that are already imported
        const existingPaths = new Set(projects.map(p => p.path));
        const available = result.directories.filter(
          (d: RemoteDirectory) => !existingPaths.has(d.path)
        );
        setRemoteDirectories(available);
      } else {
        setImportError(result.error || 'Failed to load directories');
      }
    } catch (error) {
      setImportError('Failed to connect to server');
    } finally {
      setIsLoadingRemote(false);
    }
  };

  const handleOpenImport = () => {
    setImportModalOpen(true);
    setManualDirName('');
    setImportError(null);
    loadRemoteDirectories();
  };

  const importProject = async (dirName: string, dirPath: string) => {
    // Check if already exists
    if (projects.some(p => p.path === dirPath)) {
      setImportError('This project is already imported');
      return;
    }

    setIsImporting(true);
    
    try {
      const project: Project = {
        id: generateId(),
        name: dirName,
        path: dirPath,
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addProject(project);
      setImportModalOpen(false);
      setManualDirName('');
    } catch (error) {
      setImportError('Failed to import project');
    } finally {
      setIsImporting(false);
    }
  };

  const handleManualImport = async () => {
    if (!manualDirName.trim()) {
      setImportError('Please enter a directory name');
      return;
    }
    
    try {
      // Get the base path from server
      const response = await fetch('/api/projects/base-path');
      const { basePath } = await response.json();
      const dirPath = `${basePath}/${manualDirName.trim()}`;
      importProject(manualDirName.trim(), dirPath);
    } catch {
      setImportError('Failed to get base path from server');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenImport} className="gap-2">
            <FolderInput className="h-4 w-4" />
            Import Existing
          </Button>
          <Link href="/projects/new">
            <Button className="gap-2">
              <FolderPlus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create a new project or import an existing one'}
              </p>
              {!searchQuery && (
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={handleOpenImport} className="gap-2">
                    <FolderInput className="h-4 w-4" />
                    Import Existing
                  </Button>
                  <Link href="/projects/new">
                    <Button className="gap-2">
                      <FolderPlus className="h-4 w-4" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{project.name}</h3>
                    </div>
                  </div>
                  <Badge variant={statusVariants[project.status]}>{project.status}</Badge>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <p>Created: {formatDate(project.createdAt)}</p>
                  <p>Updated: {formatDate(project.updatedAt)}</p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Link href={`/upload?project=${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </Button>
                  </Link>
                  <Link href={`/pipeline?project=${project.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Settings2 className="h-3.5 w-3.5" />
                      Configure
                    </Button>
                  </Link>
                  <Link href={`/results?project=${project.id}`}>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteClick(project)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        description="Choose how to delete this project"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{projectToDelete?.name}</strong>?
          </p>
          
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <Switch
              checked={deleteFromServer}
              onCheckedChange={setDeleteFromServer}
              label="Also delete files from server"
            />
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⚠️ Warning: This will permanently delete all files in the project directory on the server.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              {deleteFromServer ? 'Delete Everything' : 'Remove from List'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Project Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Existing Project"
        description="Import a project from the server"
        size="lg"
      >
        <div className="space-y-6">
          {importError && (
            <Alert variant="error" title="Error" onClose={() => setImportError(null)}>
              {importError}
            </Alert>
          )}

          {/* Manual Entry */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter directory name
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="my-project-folder"
                value={manualDirName}
                onChange={(e) => setManualDirName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleManualImport} 
                disabled={!manualDirName.trim() || isImporting}
                isLoading={isImporting}
              >
                Import
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter just the folder name, not the full path
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">or select from server</span>
            </div>
          </div>

          {/* Remote Directory List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Available directories
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={loadRemoteDirectories}
                disabled={isLoadingRemote}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingRemote ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isLoadingRemote ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : remoteDirectories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No new directories found</p>
                <p className="text-xs">All existing directories are already imported</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {remoteDirectories.map((dir) => (
                  <div
                    key={dir.path}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{dir.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Modified: {formatDate(dir.modifiedAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => importProject(dir.name, dir.path)}
                      disabled={isImporting}
                    >
                      Import
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
