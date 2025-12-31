'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { generateId, slugify } from '@/lib/utils';
import { FolderPlus, ArrowRight, Loader2 } from 'lucide-react';
import { Project } from '@/types';

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [basePath, setBasePath] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch base path from server
  useEffect(() => {
    fetch('/api/projects/base-path')
      .then(res => res.json())
      .then(data => setBasePath(data.basePath))
      .catch(() => setError('Failed to load configuration'));
  }, []);

  const projectPath = formData.name && basePath
    ? `${basePath}/${slugify(formData.name)}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsCreating(true);

    try {
      // Create project on remote server
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          path: projectPath,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Add to local store
      const project: Project = {
        id: generateId(),
        name: formData.name.trim(),
        path: projectPath,
        description: formData.description.trim() || undefined,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addProject(project);
      router.push(`/upload?project=${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FolderPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Set up a new analysis project directory
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error" title="Error">
                {error}
              </Alert>
            )}

            <Input
              label="Project Name"
              placeholder="e.g., Sample_Analysis_2024"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helpText="Use alphanumeric characters, dashes, or underscores"
            />

            <Textarea
              label="Description (optional)"
              placeholder="Brief description of this analysis project..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />

            {formData.name && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Directory Structure
                </p>
                <div className="font-mono text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>{slugify(formData.name)}/</p>
                  <p className="pl-4">├── raw/</p>
                  <p className="pl-4">└── results/</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Create directory</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The project directory with raw/ and results/ subdirectories will be created on the remote server
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Upload FASTQ files</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload your sequencing data files to the raw/ directory
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Configure and run</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set pipeline parameters and submit the job to the scheduler
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
