# Web Application Specification: FASTQ Upload, Remote Execution, and Results Browser

## Project Context

This pipeline is developed for the **Animal Disease Research and
Diagnostic Laboratory**,\
**South Dakota State University**.

Copyright © Naveen Duhan\
Developed by Naveen Duhan

------------------------------------------------------------------------

## Objective

Create a web application that allows users to define a project
directory, upload FASTQ files to a remote server, configure and run a
Nextflow-based pipeline, and browse results in a structured and
reproducible way.

Each analysis must run inside its own isolated directory with clearly
separated input and output locations.

------------------------------------------------------------------------

## High-Level Workflow

1.  User provides a project directory name or path\
2.  System creates the project directory on the remote server\
3.  Inside the project directory, the system creates:
    -   `raw/` for FASTQ uploads\
    -   `results/` for pipeline outputs\
4.  User uploads FASTQ files into `raw/` using SFTP\
5.  User configures pipeline parameters through the UI\
6.  Application builds and submits a Nextflow command\
7.  Pipeline runs on the remote system using a scheduler\
8.  Outputs are written only to the `results/` directory\
9.  User browses results through a web-based file browser

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   Next.js (\>15)
-   TypeScript
-   Tailwind CSS v4
-   Responsive, accessible UI
-   Component-based design
-   Upload progress indicators
-   Job and status tracking views

### Backend

-   API routes or backend service for:
    -   Project directory creation
    -   SFTP uploads
    -   Remote command execution via SSH
    -   Job monitoring
    -   File browsing
-   Secure credential handling
-   Stateless execution with persisted job metadata

### Workflow Engine

-   Nextflow
-   Scheduler support (for example Slurm)
-   Profile-based execution
-   Queue-based submission

------------------------------------------------------------------------

## Project Directory Structure

### User-Defined Project Directory

Example:

    /data/projects/project_001

### Automatically Created Layout

    project_001/
    ├── raw/
    │   ├── sample_R1.fastq.gz
    │   └── sample_R2.fastq.gz
    └── results/

Rules: - FASTQ files are uploaded only into `raw/` - Pipeline outputs
are written only into `results/` - Users cannot write outside their
project directory - Each job is associated with exactly one project
directory

------------------------------------------------------------------------

## FASTQ Upload Module (SFTP)

Features: - Upload single or paired-end FASTQ files - Upload destination
fixed to `<project_dir>/raw/` - Allowed extensions: - `.fastq` - `.fq` -
`.fastq.gz` - Upload progress display - File listing with size and
timestamp

------------------------------------------------------------------------

## Pipeline Configuration Interface

The UI must expose structured inputs that map directly to command-line
arguments.

------------------------------------------------------------------------

### Required Parameters

-   `--input`\
    Path to the input samplesheet (mandatory)

-   `--kraken2_db`\
    Path to Kraken2 database (required for taxonomic profiling)

-   `--checkv_db`\
    Path to CheckV database (required for viral genome completion)

------------------------------------------------------------------------

### Output Handling

-   `--outdir`\
    Automatically set to:

        <project_dir>/results

    This value should not be editable by the user.

------------------------------------------------------------------------

### Optional Database and Resource Paths

-   `--adapters`\
    Adapter file for trimming

-   `--blastdb_viruses`\
    Viral BLAST database path

-   `--blastdb_nt`\
    BLAST nt database path

-   `--blastdb_nr`\
    BLAST nr database path

-   `--diamonddb`\
    DIAMOND protein database path

------------------------------------------------------------------------

### Tool Selection Options

-   `--trimming_tool`\
    Options:
    -   fastp (default)
    -   flexbar
    -   trim_galore
-   `--assembler`\
    Options:
    -   megahit
    -   metaspades
    -   hybrid (default)

------------------------------------------------------------------------

### Quality and Assembly Parameters

-   `--min_contig_length`\
    Default: 200

-   `--quality`\
    Default: 30

------------------------------------------------------------------------

## Execution Configuration

-   `--profile`\
    Nextflow profile\
    Default: `slurm`

-   `--queue`\
    Scheduler queue or partition name

------------------------------------------------------------------------

## Skip-Step Controls

Provide toggle controls for optional steps.

### Skip Flags

-   `--skip_quality`
-   `--skip_trimming`
-   `--skip_assembly`
-   `--skip_blast_annotation`
-   `--skip_taxonomic_profiling`
-   `--skip_viral_analysis`
-   `--skip_coverage_analysis`
-   `--skip_contig_organization`
-   `--skip_visualization`
-   `--skip_final_report`

------------------------------------------------------------------------

## Command Construction Logic

The application dynamically builds the Nextflow command using validated
inputs.

Example:

``` bash
nextflow run main.nf   --input samplesheet.csv   --outdir /data/projects/project_001/results   --assembler hybrid   --trimming_tool fastp   --kraken2_db /db/kraken2   --checkv_db /db/checkv   --quality 30   --min_contig_length 200   --profile slurm   --queue long
```

Execution happens remotely via SSH.

------------------------------------------------------------------------

## Job Submission and Monitoring

Features: - Submit jobs to the scheduler - Capture job ID - Track job
states: queued, running, completed, failed - Stream or poll logs -
Persist job metadata for reproducibility

------------------------------------------------------------------------

## Results File Browser

After completion:

-   Display contents of the `results/` directory
-   Folder-based navigation
-   File size and modification time
-   Download support
-   Read-only access
-   Access restricted to project scope

------------------------------------------------------------------------

## Future Visualization Layer

After pipeline completion, add reusable visualization components:

-   Quality control summaries
-   Read statistics
-   Assembly metrics
-   Contig length distributions
-   Taxonomic abundance
-   Viral genome completeness
-   Coverage plots

Each visualization should be implemented as a reusable Next.js
component.

------------------------------------------------------------------------

## Design Principles

-   Clear separation between UI, backend, and execution layers
-   Strict directory isolation per project
-   Reproducible and auditable workflows
-   Secure credential handling
-   Scalable foundation for SaaS deployment
-   Clean, scientific, and user-friendly interface

------------------------------------------------------------------------

## Final Outcome

A production-ready web application that:

-   Creates project directories automatically\
-   Uploads FASTQ files into `raw/`\
-   Executes Nextflow pipelines remotely\
-   Writes outputs only to `results/`\
-   Provides a structured results browser\
-   Supports future visualization and automation

------------------------------------------------------------------------

**Animal Disease Research and Diagnostic Laboratory**\
**South Dakota State University**

© Naveen Duhan\
Developed by Naveen Duhan
