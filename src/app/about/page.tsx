'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2,
  Dna,
  Server,
  Github,
  Mail,
  Building2,
  ExternalLink,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">About</h1>
        <p className="text-gray-500 dark:text-gray-400">Learn more about NGSDiag</p>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img 
              src="/images/logo.png" 
              alt="NGSDiag Logo" 
              className="w-20 h-20 rounded-2xl object-contain shrink-0"
            />
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NGSDiag</h2>
                <p className="text-gray-500 dark:text-gray-400">Next-Generation Sequencing–Driven Diagnostics</p>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                NGSDiag is a comprehensive web application for NGS-based diagnostic workflows. 
                It provides a user-friendly interface for uploading FASTQ files, configuring pipeline 
                parameters, submitting jobs to HPC clusters, and browsing analysis results including 
                pathogen detection, taxonomic classification, and variant analysis.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Nextflow
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Next.js
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  SLURM
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  Diagnostics
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Metagenomics
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Project management with remote directory creation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">FASTQ file upload with automatic samplesheet generation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Pipeline configuration with all parameters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Job submission and real-time monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Results browser with BLAST, Kraken2, Coverage analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Interactive visualizations and data export</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Dark and light theme support</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Technical Stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="h-5 w-5" />
              Technical Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Frontend</p>
                <p className="text-gray-600 dark:text-gray-400">Next.js 15, React, TypeScript, Tailwind CSS</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Backend</p>
                <p className="text-gray-600 dark:text-gray-400">Next.js API Routes, SSH2 for remote execution</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Pipeline</p>
                <p className="text-gray-600 dark:text-gray-400">Nextflow, SLURM scheduler, Conda environments</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-1">Storage</p>
                <p className="text-gray-600 dark:text-gray-400">SFTP or local mount (sshfs) for file access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Institution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Institution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Animal Disease Research and Diagnostic Laboratory</p>
                <p className="text-gray-600 dark:text-gray-400">South Dakota State University</p>
              </div>
              <a 
                href="https://www.sdstate.edu/animal-disease-research-and-diagnostic-laboratory" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Visit ADRDL Website
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Developer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Naveen Duhan, Ph.D.</p>
                <p className="text-gray-600 dark:text-gray-400">Bioinformatician</p>
                <p className="text-gray-600 dark:text-gray-400">Animal Disease Research and Diagnostic Laboratory</p>
              </div>
              <div className="flex flex-col gap-2">
                <a 
                  href="mailto:naveen.duhan@sdstate.edu"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  naveen.duhan@sdstate.edu
                </a>
                <a 
                  href="https://www.sdstate.edu/directory/naveen-duhan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  SDSU Directory Profile
                </a>
                <a 
                  href="https://github.com/navduhan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </div>
              <p className="text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-800">
                © {new Date().getFullYear()} All rights reserved
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
