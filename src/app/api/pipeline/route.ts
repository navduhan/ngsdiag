import { NextRequest, NextResponse } from 'next/server';
import { submitJob } from '@/lib/storage';

// Database paths from environment variables (must be configured in .env.local)
const DATABASE_PATHS = {
  kraken2_db: process.env.KRAKEN2_DB || '',
  checkv_db: process.env.CHECKV_DB || '',
  blastdb_viruses: process.env.BLASTDB_VIRUSES || '',
  blastdb_nt: process.env.BLASTDB_NT || '',
  blastdb_nr: process.env.BLASTDB_NR || '',
  diamonddb: process.env.DIAMONDDB || '',
};

interface PipelineConfig {
  trimming_tool: string;
  assembler: string;
  min_contig_length: number;
  quality: number;
  profile: string;
  queue: string;
  skip_quality: boolean;
  skip_trimming: boolean;
  skip_assembly: boolean;
  skip_blast_annotation: boolean;
  skip_taxonomic_profiling: boolean;
  skip_viral_analysis: boolean;
  skip_coverage_analysis: boolean;
  skip_contig_organization: boolean;
  skip_visualization: boolean;
  skip_final_report: boolean;
}

function buildCommand(projectPath: string, config: PipelineConfig): string {
  const pipelinePath = process.env.PIPELINE_PATH || '';
  
  const parts = [`nextflow run ${pipelinePath}/main.nf`];
  
  // Required parameters
  parts.push(`--input ${projectPath}/raw/samplesheet.csv`);
  parts.push(`--outdir ${projectPath}/results`);
  parts.push(`--kraken2_db ${DATABASE_PATHS.kraken2_db}`);
  parts.push(`--checkv_db ${DATABASE_PATHS.checkv_db}`);
  
  // Database paths
  parts.push(`--adapters ${pipelinePath}/assets/illumina_adapter.fa`);
  parts.push(`--blastdb_viruses ${DATABASE_PATHS.blastdb_viruses}`);
  parts.push(`--blastdb_nt ${DATABASE_PATHS.blastdb_nt}`);
  parts.push(`--blastdb_nr ${DATABASE_PATHS.blastdb_nr}`);
  parts.push(`--diamonddb ${DATABASE_PATHS.diamonddb}`);
  
  // Tool selection
  parts.push(`--trimming_tool ${config.trimming_tool}`);
  parts.push(`--assembler ${config.assembler}`);
  
  // Quality parameters
  parts.push(`--quality ${config.quality}`);
  parts.push(`--min_contig_length ${config.min_contig_length}`);
  
  // Execution config
  parts.push(`-profile ${config.profile}`);
  if (config.queue) parts.push(`--queue ${config.queue}`);
  
  // Skip flags
  if (config.skip_quality) parts.push('--skip_quality');
  if (config.skip_trimming) parts.push('--skip_trimming');
  if (config.skip_assembly) parts.push('--skip_assembly');
  if (config.skip_blast_annotation) parts.push('--skip_blast_annotation');
  if (config.skip_taxonomic_profiling) parts.push('--skip_taxonomic_profiling');
  if (config.skip_viral_analysis) parts.push('--skip_viral_analysis');
  if (config.skip_coverage_analysis) parts.push('--skip_coverage_analysis');
  if (config.skip_contig_organization) parts.push('--skip_contig_organization');
  if (config.skip_visualization) parts.push('--skip_visualization');
  if (config.skip_final_report) parts.push('--skip_final_report');
  
  return parts.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const { projectPath, config } = await request.json();

    if (!projectPath || !config) {
      return NextResponse.json(
        { success: false, error: 'Project path and config are required' },
        { status: 400 }
      );
    }

    // Build command server-side with proper paths
    const command = buildCommand(projectPath, config);

    // Submit the job
    const result = await submitJob(projectPath, command);

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      output: result.output,
    });
  } catch (error) {
    console.error('Failed to submit pipeline job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit job. Check server connection.' },
      { status: 500 }
    );
  }
}
