'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { FileDropzone } from '@/components/upload/file-dropzone';
import { UploadProgressList } from '@/components/upload/upload-progress-list';
import { SamplesheetCreator } from '@/components/upload/samplesheet-creator';
import { Upload, FolderOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { UploadProgress } from '@/types';

function UploadPageContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const { projects, updateProject } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  const handleUpload = async () => {
    if (!selectedProject || selectedFiles.length === 0) {
      setError('Please select a project and files to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    // Initialize progress
    const initialProgress: UploadProgress[] = selectedFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));
    setUploadProgress(initialProgress);

    // Update project status
    updateProject(selectedProject.id, { status: 'uploading' });

    let successCount = 0;
    let failCount = 0;
    let currentProgress = [...initialProgress];
    const successfulUploads: string[] = [];

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Update status to uploading
      currentProgress = currentProgress.map((p, idx) =>
        idx === i ? { ...p, status: 'uploading' as const, progress: 0 } : p
      );
      setUploadProgress([...currentProgress]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectPath', `${selectedProject.path}/raw`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          successCount++;
          successfulUploads.push(file.name);
          currentProgress = currentProgress.map((p) =>
            p.fileName === file.name
              ? { ...p, status: 'completed' as const, progress: 100 }
              : p
          );
          setUploadProgress([...currentProgress]);
        } else {
          failCount++;
          currentProgress = currentProgress.map((p) =>
            p.fileName === file.name
              ? { ...p, status: 'failed' as const, error: result.error }
              : p
          );
          setUploadProgress([...currentProgress]);
        }
      } catch (err) {
        failCount++;
        currentProgress = currentProgress.map((p) =>
          p.fileName === file.name
            ? { ...p, status: 'failed' as const, error: 'Network error' }
            : p
        );
        setUploadProgress([...currentProgress]);
      }
    }

    setIsUploading(false);
    setUploadedFileNames((prev) => [...prev, ...successfulUploads]);

    // Update project status
    if (failCount === 0) {
      updateProject(selectedProject.id, { status: 'ready', updatedAt: new Date() });
      setSuccess(`Successfully uploaded ${successCount} file(s). Now create a samplesheet below.`);
    } else if (successCount > 0) {
      updateProject(selectedProject.id, { status: 'ready', updatedAt: new Date() });
      setSuccess(`Uploaded ${successCount} file(s), ${failCount} failed`);
    } else {
      updateProject(selectedProject.id, { status: 'created', updatedAt: new Date() });
      setError('All uploads failed. Please check the server connection.');
    }

    setSelectedFiles([]);
  };

  const handleSaveSamplesheet = async (csvContent: string) => {
    if (!selectedProject) return;

    const response = await fetch('/api/samplesheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectPath: selectedProject.path,
        content: csvContent,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to save samplesheet');
    }
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Project
          </CardTitle>
          <CardDescription>
            Choose the project to upload FASTQ files to
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No projects available. Create a project first.
              </p>
              <Link href="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <Select
              label="Project"
              options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setUploadedFileNames([]); // Reset uploaded files when project changes
              }}
            />
          )}
          
          {selectedProject && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Upload destination:</strong> {selectedProject.name}/raw/
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload FASTQ Files
            </CardTitle>
            <CardDescription>
              Upload single or paired-end FASTQ files to the project&apos;s raw directory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="error" title="Upload Error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert variant="success" title="Success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            <FileDropzone
              onFilesSelected={setSelectedFiles}
              disabled={isUploading}
            />

            {uploadProgress.length > 0 && (
              <UploadProgressList uploads={uploadProgress} />
            )}

            <div className="flex justify-end gap-3">
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                isLoading={isUploading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Samplesheet Creator */}
      {selectedProject && uploadedFileNames.length > 0 && (
        <SamplesheetCreator
          projectPath={selectedProject.path}
          uploadedFiles={uploadedFileNames}
          onSave={handleSaveSamplesheet}
        />
      )}

      {/* Next Steps */}
      {selectedProject && uploadedFileNames.length > 0 && (
        <div className="flex justify-end">
          <Link href={`/pipeline?project=${selectedProject.id}`}>
            <Button className="gap-2">
              Configure Pipeline
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-900 dark:text-white">Supported formats:</strong>{' '}
            .fastq, .fq, .fastq.gz, .fq.gz
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Naming convention:</strong>{' '}
            For paired-end reads, use _R1/_R2 or _1/_2 suffixes (e.g., sample_R1.fastq.gz, sample_R2.fastq.gz)
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Sample ID extraction:</strong>{' '}
            Sample IDs are auto-extracted by splitting on _L001, _R1, _R2, _1.f, or _2.f
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>}>
      <UploadPageContent />
    </Suspense>
  );
}
