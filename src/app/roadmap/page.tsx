'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2,
  Clock,
  Sparkles,
  Dna,
  GitBranch,
  BarChart3,
  Target,
  Microscope,
  Database,
  FileSearch,
  Workflow,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItemProps {
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  icon: React.ElementType;
}

function FeatureItem({ title, description, status, icon: Icon }: FeatureItemProps) {
  const statusConfig = {
    completed: {
      label: 'Completed',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle2,
    },
    'in-progress': {
      label: 'In Progress',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Zap,
    },
    planned: {
      label: 'Planned',
      color: 'text-gray-500 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800/50',
      border: 'border-gray-200 dark:border-gray-700',
      icon: Clock,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      config.border,
      config.bg
    )}>
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.bg)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              config.bg,
              config.color
            )}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roadmap</h1>
        <p className="text-gray-500 dark:text-gray-400">Current features and future development plans</p>
      </div>

      {/* Current Version */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Current Features (v1.0)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureItem
            icon={Workflow}
            title="De Novo Assembly Pipeline"
            description="Metagenomic assembly using MEGAHIT, metaSPAdes, or hybrid approach for viral discovery"
            status="completed"
          />
          <FeatureItem
            icon={Database}
            title="Taxonomic Classification"
            description="Kraken2-based taxonomic profiling with interactive Krona visualizations"
            status="completed"
          />
          <FeatureItem
            icon={FileSearch}
            title="BLAST Analysis"
            description="Sequence similarity search against NR, NT, and virus-specific databases with filtering and visualization"
            status="completed"
          />
          <FeatureItem
            icon={Microscope}
            title="Viral Analysis"
            description="CheckV integration for viral genome quality assessment and completeness estimation"
            status="completed"
          />
          <FeatureItem
            icon={BarChart3}
            title="Coverage Analysis"
            description="Contig coverage statistics with detailed metrics and exportable reports"
            status="completed"
          />
          <FeatureItem
            icon={Dna}
            title="Sequence Extraction"
            description="Extract FASTA sequences from BLAST results for downstream analysis"
            status="completed"
          />
        </CardContent>
      </Card>

      {/* In Development */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            In Development
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureItem
            icon={Target}
            title="Reference-Based Assembly"
            description="Map reads to reference genomes for targeted viral detection and consensus sequence generation"
            status="in-progress"
          />
          <FeatureItem
            icon={GitBranch}
            title="iSNV Identification"
            description="Intra-host single nucleotide variant calling to detect viral quasispecies and minority variants"
            status="in-progress"
          />
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Planned Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FeatureItem
            icon={GitBranch}
            title="Phylogenetic Analysis"
            description="Automated phylogenetic tree construction and visualization for evolutionary analysis"
            status="planned"
          />
          <FeatureItem
            icon={Shield}
            title="Antimicrobial Resistance Detection"
            description="Identify AMR genes and predict resistance phenotypes from metagenomic data"
            status="planned"
          />
          <FeatureItem
            icon={Database}
            title="Custom Database Support"
            description="Upload and use custom BLAST databases for specialized pathogen detection"
            status="planned"
          />
          <FeatureItem
            icon={BarChart3}
            title="Comparative Analysis"
            description="Compare results across multiple samples with statistical analysis and heatmaps"
            status="planned"
          />
          <FeatureItem
            icon={Workflow}
            title="Automated Reporting"
            description="Generate comprehensive PDF reports with customizable templates"
            status="planned"
          />
          <FeatureItem
            icon={Microscope}
            title="Host Genome Filtering"
            description="Remove host sequences before analysis with support for multiple host genomes"
            status="planned"
          />
        </CardContent>
      </Card>

      {/* Request Feature */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Have a Feature Request?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              We're always looking to improve! If you have ideas for new features or improvements,
              please reach out to us.
            </p>
            <a 
              href="mailto:naveen.duhan@sdstate.edu?subject=Feature Request"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Request a Feature
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
