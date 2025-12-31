'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import { 
  PlayCircle, 
  RefreshCw, 
  XCircle, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSearch,
  Terminal,
  RotateCw,
  Trash2
} from 'lucide-react';
import { Job, JobStatus } from '@/types';

const statusConfig: Record<JobStatus, { icon: React.ReactNode; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  queued: { icon: <Clock className="h-4 w-4" />, variant: 'info', label: 'Queued' },
  running: { icon: <Loader2 className="h-4 w-4 animate-spin" />, variant: 'warning', label: 'Running' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, variant: 'success', label: 'Completed' },
  failed: { icon: <AlertCircle className="h-4 w-4" />, variant: 'error', label: 'Failed' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, variant: 'default', label: 'Cancelled' },
};

export default function JobsPage() {
  const { jobs, projects, updateJob, deleteJob } = useStore();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobLogs, setJobLogs] = useState<string>('');
  const [nextflowLogs, setNextflowLogs] = useState<string>('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState<string>('');

  const refreshJobStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/jobs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: jobs.filter(j => j.status === 'running' || j.status === 'queued').map(j => j.schedulerJobId) }),
      });
      const result = await response.json();
      
      if (result.success && result.statuses) {
        Object.entries(result.statuses).forEach(([jobId, status]) => {
          const job = jobs.find(j => j.schedulerJobId === jobId);
          if (job) {
            updateJob(job.id, { status: status as JobStatus });
          }
        });
      }
    } catch (err) {
      console.error('Failed to refresh job status:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchJobLogs = async (job: Job) => {
    setIsLoadingLogs(true);
    setJobLogs('');
    setNextflowLogs('');
    setRealTimeStatus('');
    
    try {
      const project = projects.find(p => p.id === job.projectId);
      const response = await fetch('/api/jobs/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: job.schedulerJobId,
          projectPath: project?.path 
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        setJobLogs(result.log || 'No logs found');
        setNextflowLogs(result.nextflowLog || '');
        setRealTimeStatus(result.status || '');
        
        // Update job status if different
        if (result.status && result.status !== job.status) {
          updateJob(job.id, { status: result.status as JobStatus });
        }
      } else {
        setJobLogs('Failed to fetch logs: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      setJobLogs('Error fetching logs: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const cancelJob = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.schedulerJobId }),
      });
      const result = await response.json();
      
      if (result.success) {
        updateJob(job.id, { status: 'cancelled' });
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const viewLogs = (job: Job) => {
    setSelectedJob(job);
    setLogModalOpen(true);
    fetchJobLogs(job);
  };

  const refreshLogs = () => {
    if (selectedJob) {
      fetchJobLogs(selectedJob);
    }
  };

  const filterJobs = (status?: JobStatus | 'active') => {
    if (!status) return jobs;
    if (status === 'active') return jobs.filter(j => j.status === 'running' || j.status === 'queued');
    return jobs.filter(j => j.status === status);
  };

  const activeJobs = filterJobs('active');
  const completedJobs = filterJobs('completed');
  const failedJobs = filterJobs('failed');

  const JobCard = ({ job }: { job: Job }) => {
    const config = statusConfig[job.status] || statusConfig.queued; // Fallback to queued if status unknown
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                job.status === 'running' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                job.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' :
                job.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {config.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{job.projectName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Job ID: {job.schedulerJobId || job.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-4">
            <p>Submitted: {formatDate(job.submittedAt)}</p>
            {job.startedAt && <p>Started: {formatDate(job.startedAt)}</p>}
            {job.completedAt && <p>Completed: {formatDate(job.completedAt)}</p>}
          </div>

          {job.error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{job.error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" size="sm" onClick={() => viewLogs(job)} className="flex-1 gap-1">
              <Terminal className="h-3.5 w-3.5" />
              View Logs
            </Button>
            
            {job.status === 'completed' && (
              <Link href={`/results?project=${job.projectId}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <FileSearch className="h-3.5 w-3.5" />
                  Results
                </Button>
              </Link>
            )}
            
            {(job.status === 'running' || job.status === 'queued') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => cancelJob(job)}
                className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                title="Cancel Job"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => deleteJob(job.id)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete Job"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor and manage pipeline jobs</p>
        </div>
        <Button onClick={refreshJobStatus} disabled={isRefreshing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <PlayCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No jobs yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Configure and submit a pipeline to see jobs here
                  </p>
                  <Link href="/pipeline">
                    <Button>Configure Pipeline</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                No active jobs
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                No completed jobs
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="failed">
          {failedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                No failed jobs
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {failedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={`Job Logs - ${selectedJob?.projectName}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Job ID:</span>{' '}
                  <span className="font-mono">{selectedJob?.schedulerJobId || selectedJob?.id}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
                  <Badge variant={statusConfig[realTimeStatus as JobStatus]?.variant || statusConfig[selectedJob?.status as JobStatus]?.variant || 'default'}>
                    {realTimeStatus || selectedJob?.status || 'unknown'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Submitted:</span>{' '}
                  {selectedJob && formatDate(selectedJob.submittedAt)}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshLogs} 
              disabled={isLoadingLogs}
              className="ml-4 gap-2"
            >
              <RotateCw className={`h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-500">Loading logs...</span>
            </div>
          ) : (
            <Tabs defaultValue="pipeline">
              <TabsList>
                <TabsTrigger value="pipeline">Pipeline Log</TabsTrigger>
                <TabsTrigger value="nextflow">Nextflow Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pipeline">
                <div className="log-viewer p-4 rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs overflow-auto max-h-96 font-mono whitespace-pre-wrap">
                  {jobLogs || 'No pipeline logs available yet. Click Refresh to check for updates.'}
                </div>
              </TabsContent>
              
              <TabsContent value="nextflow">
                <div className="log-viewer p-4 rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs overflow-auto max-h-96 font-mono whitespace-pre-wrap">
                  {nextflowLogs || 'No Nextflow logs available. The .nextflow.log file may not exist yet.'}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <strong>Tip:</strong> Pipeline logs show the main output. Nextflow logs contain detailed execution information. 
            Click Refresh to get the latest logs.
          </div>
        </div>
      </Modal>
    </div>
  );
}
