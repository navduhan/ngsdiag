// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Project types
export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  status: ProjectStatus;
  description?: string;
}

export type ProjectStatus = 'created' | 'uploading' | 'ready' | 'running' | 'completed' | 'failed';

// File types
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: Date;
  type?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

// Pipeline configuration types
export interface PipelineConfig {
  // Required parameters
  input: string;
  kraken2_db: string;
  checkv_db: string;
  
  // Output (auto-set)
  outdir: string;
  
  // Optional database paths
  adapters?: string;
  blastdb_viruses?: string;
  blastdb_nt?: string;
  blastdb_nr?: string;
  diamonddb?: string;
  
  // Tool selection
  trimming_tool: 'fastp' | 'flexbar' | 'trim_galore';
  assembler: 'megahit' | 'metaspades' | 'hybrid';
  
  // Quality parameters
  min_contig_length: number;
  quality: number;
  
  // Execution config
  profile: string;
  queue: string;
  
  // Skip flags
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

// Job types
export interface Job {
  id: string;
  projectId: string;
  projectName: string;
  status: JobStatus;
  command: string;
  submittedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs?: string[];
  schedulerJobId?: string;
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// Server configuration
export interface ServerConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
  pipelinePath: string;
  baseProjectPath: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Visualization types
export interface QualityMetrics {
  totalReads: number;
  qualityScore: number;
  gcContent: number;
  duplicateRate: number;
}

export interface AssemblyMetrics {
  totalContigs: number;
  n50: number;
  longestContig: number;
  totalLength: number;
}

export interface TaxonomicResult {
  taxon: string;
  count: number;
  percentage: number;
}

export interface ViralResult {
  name: string;
  completeness: number;
  length: number;
  coverage: number;
}
