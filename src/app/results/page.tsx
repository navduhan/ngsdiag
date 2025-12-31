'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileBrowser } from '@/components/results/file-browser';
import { BlastResultsTable } from '@/components/results/blast-results-table';
import { CoverageTable } from '@/components/results/coverage-table';
import { Kraken2Table } from '@/components/results/kraken2-table';
import { FileSearch, FolderOpen, Table, BarChart3, Bug } from 'lucide-react';
import Link from 'next/link';
import { FileInfo } from '@/types';

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const { projects } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const basePath = selectedProject ? `${selectedProject.path}/results` : '';

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProject && !currentPath) {
      setCurrentPath(`${selectedProject.path}/results`);
    }
  }, [selectedProject, currentPath]);

  const fetchFiles = useCallback(async (path: string) => {
    if (!path) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.files || []);
      } else {
        setError(result.error || 'Failed to fetch files');
        setFiles([]);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentPath) {
      fetchFiles(currentPath);
    }
  }, [currentPath, fetchFiles]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleRefresh = () => {
    fetchFiles(currentPath);
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download file');
      }
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Project
          </CardTitle>
          <CardDescription>
            Choose a project to browse its results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No projects available
              </p>
              <Link href="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <Select
              options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                const project = projects.find(p => p.id === e.target.value);
                if (project) {
                  setCurrentPath(`${project.path}/results`);
                }
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      {selectedProject && (
        <Tabs defaultValue="browser">
          <TabsList className="w-full justify-start mb-4 flex-wrap">
            <TabsTrigger value="browser" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              File Browser
            </TabsTrigger>
            <TabsTrigger value="blast" className="gap-2">
              <Table className="h-4 w-4" />
              BLAST Results
            </TabsTrigger>
            <TabsTrigger value="kraken2" className="gap-2">
              <Bug className="h-4 w-4" />
              Kraken2
            </TabsTrigger>
            <TabsTrigger value="coverage" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Coverage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browser">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Results Browser
                </CardTitle>
                <CardDescription>
                  Browse and download pipeline output files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="error" title="Error" onClose={() => setError(null)} className="mb-4">
                    {error}
                  </Alert>
                )}
                
                <FileBrowser
                  basePath={basePath}
                  files={files}
                  currentPath={currentPath}
                  isLoading={isLoading}
                  onNavigate={handleNavigate}
                  onRefresh={handleRefresh}
                  onDownload={handleDownload}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blast">
            <BlastResultsTable projectPath={selectedProject.path} />
          </TabsContent>

          <TabsContent value="kraken2">
            <Kraken2Table projectPath={selectedProject.path} />
          </TabsContent>

          <TabsContent value="coverage">
            <CoverageTable projectPath={selectedProject.path} />
          </TabsContent>
        </Tabs>
      )}

    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>}>
      <ResultsPageContent />
    </Suspense>
  );
}
