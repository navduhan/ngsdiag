'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { UploadProgress } from '@/types';

interface UploadProgressListProps {
  uploads: UploadProgress[];
}

const statusIcons = {
  pending: <Loader2 className="h-4 w-4 text-gray-400" />,
  uploading: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusVariants: Record<string, 'default' | 'success' | 'error' | 'info'> = {
  pending: 'default',
  uploading: 'info',
  completed: 'success',
  failed: 'error',
};

export function UploadProgressList({ uploads }: UploadProgressListProps) {
  if (uploads.length === 0) return null;

  const totalProgress = uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length;
  const completedCount = uploads.filter((u) => u.status === 'completed').length;
  const failedCount = uploads.filter((u) => u.status === 'failed').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Upload Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedCount}/{uploads.length} completed
            {failedCount > 0 && `, ${failedCount} failed`}
          </span>
        </div>
        <Progress value={totalProgress} showLabel />
      </div>

      {/* Individual Files */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {uploads.map((upload) => (
          <div
            key={upload.fileName}
            className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <div className="flex-shrink-0">
              {statusIcons[upload.status]}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {upload.fileName}
                </p>
                <Badge variant={statusVariants[upload.status]} className="ml-2">
                  {upload.status}
                </Badge>
              </div>
              
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} variant="default" />
              )}
              
              {upload.status === 'failed' && upload.error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {upload.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
