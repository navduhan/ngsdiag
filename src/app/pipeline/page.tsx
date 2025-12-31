'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { generateId } from '@/lib/utils';
import { 
  Settings2, 
  Database, 
  Wrench, 
  SkipForward, 
  PlayCircle,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { PipelineConfig, Job } from '@/types';

// Database display names (actual paths are configured server-side via .env.local)
const DATABASE_NAMES = {
  kraken2_db: 'kraken2_db',
  checkv_db: 'checkvdb',
  blastdb_viruses: 'nt_viruses',
  blastdb_nt: 'nt',
  blastdb_nr: 'nr',
  diamonddb: 'nr.dmnd',
  adapters: 'illumina_adapter.fa',
};

const defaultConfig: PipelineConfig = {
  input: '',
  kraken2_db: '',  // Server-side
  checkv_db: '',   // Server-side
  outdir: '',
  adapters: '',    // Server-side
  blastdb_viruses: '',  // Server-side
  blastdb_nt: '',  // Server-side
  blastdb_nr: '',  // Server-side
  diamonddb: '',   // Server-side
  trimming_tool: 'trim_galore',
  assembler: 'hybrid',
  min_contig_length: 200,
  quality: 30,
  profile: 'slurm',
  queue: 'compute',
  skip_quality: false,
  skip_trimming: false,
  skip_assembly: false,
  skip_blast_annotation: false,
  skip_taxonomic_profiling: false,
  skip_viral_analysis: false,
  skip_coverage_analysis: false,
  skip_contig_organization: false,
  skip_visualization: false,
  skip_final_report: false,
};

const trimmingToolOptions = [
  { value: 'trim_galore', label: 'Trim Galore (default)' },
  { value: 'fastp', label: 'fastp' },
  { value: 'flexbar', label: 'Flexbar' },
];

const assemblerOptions = [
  { value: 'hybrid', label: 'Hybrid (default)' },
  { value: 'megahit', label: 'MEGAHIT' },
  { value: 'metaspades', label: 'metaSPAdes' },
];

const profileOptions = [
  { value: 'slurm', label: 'Slurm (default)' },
  { value: 'local', label: 'Local' },
  { value: 'docker', label: 'Docker' },
  { value: 'singularity', label: 'Singularity' },
];

const queueOptions = [
  { value: 'compute', label: 'compute (default)' },
  { value: 'quickq', label: 'quickq (quick jobs)' },
  { value: 'gpu', label: 'gpu (GPU nodes)' },
  { value: 'bigmem', label: 'bigmem (high memory)' },
];

function PipelinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');
  
  const { projects, addJob, serverConfig } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [config, setConfig] = useState<PipelineConfig>(defaultConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProject) {
      setConfig((prev) => ({
        ...prev,
        input: `${selectedProject.path}/raw/samplesheet.csv`,
        outdir: `${selectedProject.path}/results`,
      }));
    }
  }, [selectedProject]);


  const handleSubmit = async () => {
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send config to API - command is built server-side with proper paths
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: selectedProject.path,
          config: {
            trimming_tool: config.trimming_tool,
            assembler: config.assembler,
            min_contig_length: config.min_contig_length,
            quality: config.quality,
            profile: config.profile,
            queue: config.queue,
            skip_quality: config.skip_quality,
            skip_trimming: config.skip_trimming,
            skip_assembly: config.skip_assembly,
            skip_blast_annotation: config.skip_blast_annotation,
            skip_taxonomic_profiling: config.skip_taxonomic_profiling,
            skip_viral_analysis: config.skip_viral_analysis,
            skip_coverage_analysis: config.skip_coverage_analysis,
            skip_contig_organization: config.skip_contig_organization,
            skip_visualization: config.skip_visualization,
            skip_final_report: config.skip_final_report,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit job');
      }

      // Create job record
      const job: Job = {
        id: generateId(),
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        status: 'queued',
        command: 'Pipeline submitted', // Command is built server-side
        submittedAt: new Date(),
        schedulerJobId: result.jobId,
      };

      addJob(job);
      router.push('/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Select Project
          </CardTitle>
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
              options={[{ value: '', label: 'Select a project...' }, ...projectOptions]}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            />
          )}
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {error && (
            <Alert variant="error" title="Error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs defaultValue="required">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="required">Required Parameters</TabsTrigger>
              <TabsTrigger value="databases">Databases</TabsTrigger>
              <TabsTrigger value="tools">Tool Selection</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="skip">Skip Steps</TabsTrigger>
            </TabsList>

            {/* Required Parameters */}
            <TabsContent value="required">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Required Parameters
                  </CardTitle>
                  <CardDescription>
                    Essential parameters for running the pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Input Samplesheet
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {selectedProject?.name}/raw/samplesheet.csv
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Output Directory
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {selectedProject?.name}/results/
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kraken2 Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.kraken2_db}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CheckV Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.checkv_db}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Databases */}
            <TabsContent value="databases">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Configuration
                  </CardTitle>
                  <CardDescription>
                    Pre-configured databases for the pipeline (read-only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Adapters File
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.adapters}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        BLAST Viruses Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.blastdb_viruses}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        BLAST NT Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.blastdb_nt}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        BLAST NR Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.blastdb_nr}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        DIAMOND Database
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-mono">
                        ✓ {DATABASE_NAMES.diamonddb}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Note:</strong> All databases are pre-configured on the HPC cluster. No changes required.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tool Selection */}
            <TabsContent value="tools">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Tool Selection & Quality Parameters
                  </CardTitle>
                  <CardDescription>
                    Choose tools and set quality thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Trimming Tool"
                      options={trimmingToolOptions}
                      value={config.trimming_tool}
                      onChange={(e) => setConfig({ ...config, trimming_tool: e.target.value as PipelineConfig['trimming_tool'] })}
                      helpText="Tool for read trimming"
                    />
                    
                    <Select
                      label="Assembler"
                      options={assemblerOptions}
                      value={config.assembler}
                      onChange={(e) => setConfig({ ...config, assembler: e.target.value as PipelineConfig['assembler'] })}
                      helpText="Assembly algorithm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Quality Score"
                      type="number"
                      value={config.quality}
                      onChange={(e) => setConfig({ ...config, quality: parseInt(e.target.value) || 30 })}
                      helpText="Minimum quality score threshold (default: 30)"
                    />
                    
                    <Input
                      label="Minimum Contig Length"
                      type="number"
                      value={config.min_contig_length}
                      onChange={(e) => setConfig({ ...config, min_contig_length: parseInt(e.target.value) || 200 })}
                      helpText="Minimum contig length (default: 200)"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Execution */}
            <TabsContent value="execution">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Execution Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure how the pipeline will be executed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Profile"
                      options={profileOptions}
                      value={config.profile}
                      onChange={(e) => setConfig({ ...config, profile: e.target.value })}
                      helpText="Nextflow execution profile"
                    />
                    
                    <Select
                      label="Queue / Partition"
                      options={queueOptions}
                      value={config.queue}
                      onChange={(e) => setConfig({ ...config, queue: e.target.value })}
                      helpText="Scheduler queue or partition name"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skip Steps */}
            <TabsContent value="skip">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SkipForward className="h-5 w-5" />
                    Skip Steps
                  </CardTitle>
                  <CardDescription>
                    Toggle to skip optional pipeline steps
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Switch
                      checked={config.skip_quality}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_quality: checked })}
                      label="Skip Quality Control"
                    />
                    <Switch
                      checked={config.skip_trimming}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_trimming: checked })}
                      label="Skip Trimming"
                    />
                    <Switch
                      checked={config.skip_assembly}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_assembly: checked })}
                      label="Skip Assembly"
                    />
                    <Switch
                      checked={config.skip_blast_annotation}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_blast_annotation: checked })}
                      label="Skip BLAST Annotation"
                    />
                    <Switch
                      checked={config.skip_taxonomic_profiling}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_taxonomic_profiling: checked })}
                      label="Skip Taxonomic Profiling"
                    />
                    <Switch
                      checked={config.skip_viral_analysis}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_viral_analysis: checked })}
                      label="Skip Viral Analysis"
                    />
                    <Switch
                      checked={config.skip_coverage_analysis}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_coverage_analysis: checked })}
                      label="Skip Coverage Analysis"
                    />
                    <Switch
                      checked={config.skip_contig_organization}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_contig_organization: checked })}
                      label="Skip Contig Organization"
                    />
                    <Switch
                      checked={config.skip_visualization}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_visualization: checked })}
                      label="Skip Visualization"
                    />
                    <Switch
                      checked={config.skip_final_report}
                      onCheckedChange={(checked) => setConfig({ ...config, skip_final_report: checked })}
                      label="Skip Final Report"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Configuration Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Project</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedProject?.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Assembler</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{config.assembler}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Trimming Tool</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.trimming_tool.replace('_', ' ')}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Queue</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.queue}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Quality Score</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.quality}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Min Contig Length</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.min_contig_length} bp</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Profile</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{config.profile}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Skipped Steps</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {[
                      config.skip_quality,
                      config.skip_trimming,
                      config.skip_assembly,
                      config.skip_blast_annotation,
                      config.skip_taxonomic_profiling,
                      config.skip_viral_analysis,
                      config.skip_coverage_analysis,
                      config.skip_contig_organization,
                      config.skip_visualization,
                      config.skip_final_report,
                    ].filter(Boolean).length || 'None'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} isLoading={isSubmitting} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Submit Pipeline Job
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>}>
      <PipelinePageContent />
    </Suspense>
  );
}
