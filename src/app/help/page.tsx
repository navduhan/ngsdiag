'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Upload,
  Settings2,
  PlayCircle,
  FileSearch,
  HelpCircle,
  Lightbulb,
  FileText,
  Dna,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  defaultOpen?: boolean;
}

function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{question}</span>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-gray-600 dark:text-gray-400">
          {answer}
        </div>
      )}
    </div>
  );
}

interface WorkflowStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

function WorkflowStep({ step, title, description, icon: Icon }: WorkflowStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
          {step}
        </div>
        <div className="flex-1 w-px bg-gray-200 dark:bg-gray-800 my-2" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Help</h1>
        <p className="text-gray-500 dark:text-gray-400">Learn how to use NGSDiag</p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <WorkflowStep
              step={1}
              title="Create a Project"
              description="Go to Projects and create a new project or import an existing one from the server. Each project gets its own directory for files and results."
              icon={FolderOpen}
            />
            <WorkflowStep
              step={2}
              title="Upload FASTQ Files"
              description="Upload your paired-end FASTQ files (.fastq.gz). The app automatically detects sample IDs and R1/R2 pairs to generate a samplesheet."
              icon={Upload}
            />
            <WorkflowStep
              step={3}
              title="Configure Pipeline"
              description="Set pipeline parameters like assembly tools, BLAST databases, queue options, and resource limits. Default values work for most cases."
              icon={Settings2}
            />
            <WorkflowStep
              step={4}
              title="Submit & Monitor"
              description="Submit the pipeline job to the HPC cluster. Monitor progress in real-time from the Jobs page. You'll see status updates as the pipeline runs."
              icon={PlayCircle}
            />
            <WorkflowStep
              step={5}
              title="Browse Results"
              description="Once complete, explore results in the Results page. View BLAST hits, taxonomic classifications, coverage data, and download files."
              icon={FileSearch}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supported File Formats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Input Files</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">*.fastq.gz</code>
                  <span>Compressed FASTQ files (paired-end reads)</span>
                </li>
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">samplesheet.csv</code>
                  <span>Auto-generated CSV with id, read1, read2 columns</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Output Files</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">*_nr.xls / *_nt.xls</code>
                  <span>BLAST results against NR/NT databases</span>
                </li>
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">*_kraken2_report.txt</code>
                  <span>Kraken2 taxonomic classification reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">*_krona.html</code>
                  <span>Interactive Krona taxonomy visualizations</span>
                </li>
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">coverage-*.txt</code>
                  <span>Contig coverage statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">*_contigs.fa</code>
                  <span>Assembled contigs from different assemblers</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5" />
            Pipeline Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Assembly Tools</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><strong>MEGAHIT:</strong> Fast, memory-efficient</li>
                  <li><strong>MetaSPAdes:</strong> More accurate, slower</li>
                  <li><strong>Hybrid:</strong> Uses both for best results</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">BLAST Databases</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><strong>NR:</strong> Non-redundant protein sequences</li>
                  <li><strong>NT:</strong> Nucleotide collection</li>
                  <li><strong>NT_Viruses:</strong> Virus-specific subset</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Queue Options</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><strong>compute:</strong> Standard compute nodes</li>
                  <li><strong>quickq:</strong> Quick jobs (shorter time)</li>
                  <li><strong>gpu:</strong> GPU-accelerated nodes</li>
                  <li><strong>bigmem:</strong> High-memory nodes</li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resources</h4>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li><strong>CPUs:</strong> Number of CPU cores</li>
                  <li><strong>Memory:</strong> RAM allocation (GB)</li>
                  <li><strong>Time:</strong> Max runtime (hours)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Getting Started */}
            <FAQItem
              question="How do I start a new analysis?"
              defaultOpen={true}
              answer={
                <p>
                  Go to <strong>Projects</strong> → click <strong>New Project</strong> → enter a project name 
                  and click Create. Then navigate to <strong>Upload Files</strong> to add your FASTQ files.
                </p>
              }
            />
            <FAQItem
              question="How do I name my FASTQ files?"
              answer={
                <div className="space-y-2">
                  <p>Files should follow standard Illumina naming conventions:</p>
                  <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    SampleID_S1_L001_R1_001.fastq.gz<br />
                    SampleID_S1_L001_R2_001.fastq.gz
                  </code>
                  <p>The app extracts the sample ID automatically and pairs R1/R2 files.</p>
                </div>
              }
            />
            <FAQItem
              question="Can I analyze multiple samples at once?"
              answer={
                <p>
                  Yes! Upload all your paired-end FASTQ files together. The app will automatically 
                  detect each sample based on filenames and create a samplesheet with all samples. 
                  The pipeline processes all samples in parallel.
                </p>
              }
            />

            {/* Projects */}
            <FAQItem
              question="Can I import existing projects?"
              answer={
                <p>
                  Yes! On the Projects page, click <strong>Import Existing</strong> to see projects already 
                  on the server. This is useful for accessing results from previous pipeline runs.
                </p>
              }
            />
            <FAQItem
              question="How do I delete a project?"
              answer={
                <p>
                  On the Projects page, click the <strong>trash icon</strong> next to the project you want 
                  to delete. You can choose to delete just from the app or also remove files from the server.
                </p>
              }
            />

            {/* Pipeline */}
            <FAQItem
              question="Which assembly tool should I choose?"
              answer={
                <div className="space-y-2">
                  <p><strong>MEGAHIT:</strong> Fast and memory-efficient. Good for most samples.</p>
                  <p><strong>MetaSPAdes:</strong> More accurate but slower and uses more memory.</p>
                  <p><strong>Hybrid:</strong> Runs both and combines results. Best quality but takes longest.</p>
                </div>
              }
            />
            <FAQItem
              question="What queue should I select?"
              answer={
                <div className="space-y-2">
                  <p><strong>compute:</strong> Standard queue for most jobs.</p>
                  <p><strong>quickq:</strong> For small/quick jobs (shorter time limit).</p>
                  <p><strong>bigmem:</strong> For jobs requiring lots of memory.</p>
                  <p><strong>gpu:</strong> For GPU-accelerated processing.</p>
                </div>
              }
            />
            <FAQItem
              question="How long does the pipeline take?"
              answer={
                <p>
                  Runtime depends on sample size, number of samples, and selected options. A typical 
                  single sample takes 2-6 hours. BLAST searches against NR/NT databases are usually 
                  the longest steps. You can monitor progress on the Jobs page.
                </p>
              }
            />

            {/* Jobs */}
            <FAQItem
              question="What do the job statuses mean?"
              answer={
                <div className="space-y-2">
                  <p><strong>PENDING:</strong> Job is queued, waiting for resources.</p>
                  <p><strong>RUNNING:</strong> Job is actively processing.</p>
                  <p><strong>COMPLETED:</strong> Job finished successfully.</p>
                  <p><strong>FAILED:</strong> Job encountered an error.</p>
                  <p><strong>CANCELLED:</strong> Job was manually cancelled.</p>
                </div>
              }
            />
            <FAQItem
              question="What happens if my job fails?"
              answer={
                <p>
                  Check the Jobs page for error messages. Common issues include insufficient resources 
                  (try increasing memory or time), corrupted input files, or queue limits. You can 
                  adjust parameters and resubmit the job.
                </p>
              }
            />
            <FAQItem
              question="Can I cancel a running job?"
              answer={
                <p>
                  Yes! Go to the <strong>Jobs</strong> page and click the <strong>Cancel</strong> button 
                  next to the running job. The job will be terminated on the server.
                </p>
              }
            />

            {/* Results */}
            <FAQItem
              question="Where do I find my results?"
              answer={
                <p>
                  Go to the <strong>Results</strong> page and make sure the correct project is selected. 
                  Results are organized in tabs: File Browser, BLAST Results, Coverage, and Kraken2.
                </p>
              }
            />
            <FAQItem
              question="How do I view BLAST results?"
              answer={
                <p>
                  Go to Results → <strong>BLAST Results</strong> tab. Select the result type (NR, NT, or 
                  NT_Viruses) and choose a file. You can search, filter by superkingdom, sort columns, 
                  and export data. Switch to "Visualization" to see charts.
                </p>
              }
            />
            <FAQItem
              question="How do I extract sequences from BLAST results?"
              answer={
                <p>
                  In the BLAST Results tab, select rows using the checkboxes, then click 
                  <strong> Extract Sequences</strong>. The app finds the matching contigs and downloads 
                  a FASTA file with your selected sequences.
                </p>
              }
            />
            <FAQItem
              question="How do I view Krona plots?"
              answer={
                <p>
                  Go to Results → <strong>Kraken2</strong> tab → <strong>Krona Plot</strong> sub-tab. 
                  Select a sample from the dropdown to load the interactive visualization. Click the 
                  fullscreen button for a larger view.
                </p>
              }
            />
            <FAQItem
              question="How do I download result files?"
              answer={
                <p>
                  In the <strong>File Browser</strong> tab, navigate to the file you want and click the 
                  <strong> download icon</strong>. For BLAST results, you can also use the 
                  <strong> Export</strong> button to download filtered/selected data as TSV.
                </p>
              }
            />

            {/* General */}
            <FAQItem
              question="How do I switch between dark and light mode?"
              answer={
                <p>
                  Click the <strong>sun/moon icon</strong> in the top-right corner of the page to toggle 
                  between light and dark themes. Your preference is saved automatically.
                </p>
              }
            />
            <FAQItem
              question="Why does loading take a while sometimes?"
              answer={
                <p>
                  The app connects to a remote HPC server to fetch files. Large result files or slow 
                  network connections can cause delays. The spinner indicates data is being fetched.
                </p>
              }
            />
            <FAQItem
              question="Who do I contact for help?"
              answer={
                <div className="space-y-2">
                  <p>
                    For technical issues with the pipeline, results interpretation, or application bugs, 
                    contact:
                  </p>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-gray-900 dark:text-white">Naveen Duhan, Ph.D.</p>
                    <p className="text-gray-600 dark:text-gray-400">Bioinformatician, ADRDL</p>
                    <a 
                      href="mailto:naveen.duhan@sdstate.edu" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      naveen.duhan@sdstate.edu
                    </a>
                  </div>
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
