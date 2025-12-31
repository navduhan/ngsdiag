'use client';

import { useState } from 'react';
import { cn, formatBytes, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { 
  Folder, 
  File, 
  FileText, 
  FileImage, 
  FileCode,
  ChevronRight,
  Download,
  ArrowUp,
  Home,
  RefreshCw
} from 'lucide-react';
import { FileInfo } from '@/types';

interface FileBrowserProps {
  basePath: string;
  files: FileInfo[];
  currentPath: string;
  isLoading: boolean;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onDownload: (file: FileInfo) => void;
}

const getFileIcon = (file: FileInfo) => {
  if (file.isDirectory) return <Folder className="h-5 w-5 text-blue-500" />;
  
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'txt':
    case 'log':
    case 'csv':
    case 'tsv':
      return <FileText className="h-5 w-5 text-gray-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <FileImage className="h-5 w-5 text-green-500" />;
    case 'html':
    case 'json':
    case 'xml':
    case 'yaml':
    case 'yml':
    case 'py':
    case 'r':
    case 'sh':
      return <FileCode className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-gray-400" />;
  }
};

export function FileBrowser({ 
  basePath, 
  files, 
  currentPath, 
  isLoading, 
  onNavigate, 
  onRefresh,
  onDownload 
}: FileBrowserProps) {
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const pathParts = currentPath.replace(basePath, '').split('/').filter(Boolean);
  
  const sortedFiles = [...files].sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'name' | 'size' | 'date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const goUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    if (parentPath.startsWith(basePath)) {
      onNavigate(parentPath);
    }
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onNavigate(basePath)}
          className="gap-1"
        >
          <Home className="h-4 w-4" />
          Results
        </Button>
        
        {pathParts.map((part, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const targetPath = basePath + '/' + pathParts.slice(0, index + 1).join('/');
                onNavigate(targetPath);
              }}
            >
              {part}
            </Button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentPath !== basePath && (
            <Button variant="outline" size="sm" onClick={goUp} className="gap-1">
              <ArrowUp className="h-4 w-4" />
              Up
            </Button>
          )}
        </div>
        
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-1">
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* File List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">This folder is empty</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400">
            <button 
              className="col-span-6 flex items-center gap-1 hover:text-gray-900 dark:hover:text-white text-left"
              onClick={() => handleSort('name')}
            >
              Name
              {sortBy === 'name' && (
                <ChevronRight className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-90', sortOrder === 'asc' && '-rotate-90')} />
              )}
            </button>
            <button 
              className="col-span-2 flex items-center gap-1 hover:text-gray-900 dark:hover:text-white text-left"
              onClick={() => handleSort('size')}
            >
              Size
              {sortBy === 'size' && (
                <ChevronRight className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-90', sortOrder === 'asc' && '-rotate-90')} />
              )}
            </button>
            <button 
              className="col-span-3 flex items-center gap-1 hover:text-gray-900 dark:hover:text-white text-left"
              onClick={() => handleSort('date')}
            >
              Modified
              {sortBy === 'date' && (
                <ChevronRight className={cn('h-4 w-4 transition-transform', sortOrder === 'desc' && 'rotate-90', sortOrder === 'asc' && '-rotate-90')} />
              )}
            </button>
            <div className="col-span-1"></div>
          </div>

          {/* Files */}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {sortedFiles.map((file) => (
              <div
                key={file.path}
                className={cn(
                  'grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                  file.isDirectory && 'cursor-pointer'
                )}
                onClick={() => file.isDirectory && onNavigate(file.path)}
              >
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {getFileIcon(file)}
                  <span className="truncate text-gray-900 dark:text-white">
                    {file.name}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">
                  {file.isDirectory ? '--' : formatBytes(file.size)}
                </div>
                <div className="col-span-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(file.modifiedAt)}
                </div>
                <div className="col-span-1 flex justify-end">
                  {!file.isDirectory && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file);
                      }}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
