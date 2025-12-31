# NGSDiag – Next-Generation Sequencing–Driven Diagnostics

A modern web application for NGS-based diagnostic pipeline management, developed for the **Animal Disease Research and Diagnostic Laboratory** at **South Dakota State University**.

© Naveen Duhan

## Features

- **Project Management**: Create and manage analysis projects with isolated directories
- **FASTQ File Upload**: Upload sequencing data files via SFTP with progress tracking
- **Pipeline Configuration**: User-friendly interface for configuring Nextflow pipeline parameters
- **Job Submission & Monitoring**: Submit and track pipeline jobs on remote servers (Slurm scheduler)
- **Results Browser**: Browse and download pipeline output files
- **Dark/Light Theme**: Modern UI with theme switching support
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **State Management**: Zustand
- **Backend**: Next.js API Routes, SSH2 for remote server communication
- **Styling**: Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Access to a remote server with SSH enabled
- Nextflow pipeline installed on the remote server

### Installation

1. Clone the repository:
   ```bash
   cd ngsdiag-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your server configuration:
   ```env
   SSH_HOST=your-server.example.com
   SSH_PORT=22
   SSH_USERNAME=your-username
   SSH_PASSWORD=your-password
   PIPELINE_PATH=/path/to/ngsdiag-pipeline
   BASE_PROJECT_PATH=/path/to/projects
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Project

1. Navigate to **Projects** > **New Project**
2. Enter a project name and optional description
3. The system will create:
   - `<project_path>/raw/` - for FASTQ uploads
   - `<project_path>/results/` - for pipeline outputs

### Uploading FASTQ Files

1. Navigate to **Upload Files**
2. Select your project
3. Drag and drop or browse for FASTQ files
4. Supported formats: `.fastq`, `.fq`, `.fastq.gz`, `.fq.gz`

### Configuring the Pipeline

1. Navigate to **Pipeline**
2. Select your project
3. Configure parameters:
   - **Required**: Input samplesheet, Kraken2 DB, CheckV DB
   - **Optional**: BLAST databases, DIAMOND database
   - **Tools**: Trimming tool, Assembler
   - **Quality**: Quality score, minimum contig length
   - **Execution**: Profile, queue
   - **Skip Steps**: Toggle optional pipeline steps

### Monitoring Jobs

- View all jobs on the **Jobs** page
- Filter by status: Active, Completed, Failed
- View logs and cancel running jobs
- Access results directly from completed jobs

### Browsing Results

1. Navigate to **Results**
2. Select your project
3. Browse the results directory
4. Download individual files

## Project Structure

```
ngsdiag-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── about/             # About page
│   │   ├── help/              # Help & FAQ page
│   │   ├── jobs/              # Job management page
│   │   ├── pipeline/          # Pipeline configuration
│   │   ├── projects/          # Project management
│   │   ├── results/           # Results browser
│   │   └── upload/            # File upload page
│   ├── components/            # React components
│   │   ├── layout/           # Layout components
│   │   ├── results/          # Results components
│   │   ├── ui/               # Reusable UI components
│   │   └── upload/           # Upload components
│   ├── lib/                  # Utility libraries
│   ├── store/                # Zustand state management
│   └── types/                # TypeScript type definitions
├── scripts/                  # Utility scripts
└── public/                   # Static assets
```

## Pipeline Parameters

### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `--input` | Path to input samplesheet CSV |
| `--kraken2_db` | Kraken2 database path |
| `--checkv_db` | CheckV database path |

### Optional Database Paths

| Parameter | Description |
|-----------|-------------|
| `--adapters` | Adapter file for trimming |
| `--blastdb_viruses` | Viral BLAST database |
| `--blastdb_nt` | BLAST nt database |
| `--blastdb_nr` | BLAST nr database |
| `--diamonddb` | DIAMOND protein database |

### Tool Selection

| Parameter | Options | Default |
|-----------|---------|---------|
| `--trimming_tool` | fastp, flexbar, trim_galore | fastp |
| `--assembler` | megahit, metaspades, hybrid | hybrid |

### Quality Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--quality` | 30 | Minimum quality score |
| `--min_contig_length` | 200 | Minimum contig length |

### Skip Flags

- `--skip_quality`
- `--skip_trimming`
- `--skip_assembly`
- `--skip_blast_annotation`
- `--skip_taxonomic_profiling`
- `--skip_viral_analysis`
- `--skip_coverage_analysis`
- `--skip_contig_organization`
- `--skip_visualization`
- `--skip_final_report`

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SSH_HOST` | Remote server hostname | Yes |
| `SSH_PORT` | SSH port (default: 22) | No |
| `SSH_USERNAME` | SSH username | Yes |
| `SSH_PASSWORD` | SSH password | Yes* |
| `SSH_PRIVATE_KEY` | SSH private key | Yes* |
| `PIPELINE_PATH` | Path to Nextflow pipeline | Yes |
| `BASE_PROJECT_PATH` | Base path for projects | Yes |
| `STORAGE_MODE` | Storage mode: 'sftp' or 'mount' | No |
| `KRAKEN2_DB` | Path to Kraken2 database | Yes |
| `CHECKV_DB` | Path to CheckV database | Yes |
| `BLASTDB_NT` | Path to BLAST NT database | Yes |
| `BLASTDB_NR` | Path to BLAST NR database | Yes |
| `BLASTDB_VIRUSES` | Path to BLAST viruses database | Yes |
| `DIAMONDDB` | Path to DIAMOND database | Yes |

*Either SSH_PASSWORD or SSH_PRIVATE_KEY is required

## Security Considerations

- Store SSH credentials securely (environment variables or secure vault)
- Use SSH key authentication when possible
- Ensure proper file permissions on the server
- Projects are isolated in their own directories
- Users can only access their project's results

## License

Copyright © Naveen Duhan. All rights reserved.

Developed for the Animal Disease Research and Diagnostic Laboratory, South Dakota State University.
