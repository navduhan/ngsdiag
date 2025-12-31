import { NextRequest, NextResponse } from 'next/server';
import { downloadFile, listDirectory } from '@/lib/storage';

// Parse FASTA file and extract sequences by IDs
function extractSequencesFromFasta(fastaContent: string, queryIds: string[]): string {
  const lines = fastaContent.split('\n');
  const sequences: Map<string, string> = new Map();
  
  let currentId = '';
  let currentSeq = '';
  
  for (const line of lines) {
    if (line.startsWith('>')) {
      // Save previous sequence
      if (currentId && currentSeq) {
        sequences.set(currentId, currentSeq);
      }
      // Parse new header - get ID (first word after >)
      currentId = line.substring(1).split(/\s+/)[0];
      currentSeq = '';
    } else {
      currentSeq += line.trim();
    }
  }
  
  // Don't forget the last sequence
  if (currentId && currentSeq) {
    sequences.set(currentId, currentSeq);
  }
  
  // Extract requested sequences
  const result: string[] = [];
  for (const queryId of queryIds) {
    const seq = sequences.get(queryId);
    if (seq) {
      result.push(`>${queryId}`);
      // Split sequence into 80 character lines
      for (let i = 0; i < seq.length; i += 80) {
        result.push(seq.substring(i, i + 80));
      }
    }
  }
  
  return result.join('\n');
}

// Detect assembly type from query ID
function detectAssemblyType(queryId: string): string {
  const lowerQueryId = queryId.toLowerCase();
  
  if (lowerQueryId.includes('hybrid')) {
    return 'hybrid_assembly';
  } else if (lowerQueryId.includes('megahit')) {
    return 'megahit_assembly';
  } else if (lowerQueryId.includes('metaspades') || lowerQueryId.includes('spades')) {
    return 'metaspades_assembly';
  }
  
  // Default fallback - try to detect from common patterns
  // k141_ is typically megahit, NODE_ is typically spades
  if (lowerQueryId.startsWith('k') && lowerQueryId.includes('_')) {
    return 'megahit_assembly';
  } else if (lowerQueryId.startsWith('node_')) {
    return 'metaspades_assembly';
  }
  
  return 'hybrid_assembly'; // default
}

// Extract sample ID from query ID (format: sampleId_contigInfo or similar)
function extractSampleId(queryId: string): string | null {
  // Try common patterns
  // Pattern: sampleId_k141_12345 or sampleId_NODE_1
  const parts = queryId.split('_');
  if (parts.length >= 2) {
    // Check if first part looks like a sample ID (not a contig prefix)
    const firstPart = parts[0].toLowerCase();
    if (!['k', 'node', 'contig', 'scaffold'].some(p => firstPart.startsWith(p))) {
      return parts[0];
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { projectPath, queryIds } = await request.json();

    if (!projectPath || !queryIds || !Array.isArray(queryIds) || queryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Project path and query IDs are required' },
        { status: 400 }
      );
    }

    const extractedSequences: string[] = [];
    const errors: string[] = [];
    const processedFiles: Set<string> = new Set();

    // Group query IDs by detected assembly type and sample
    const groupedQueries: Map<string, Map<string, string[]>> = new Map();
    
    for (const queryId of queryIds) {
      const assemblyType = detectAssemblyType(queryId);
      const sampleId = extractSampleId(queryId);
      
      const key = `${assemblyType}:${sampleId || 'unknown'}`;
      
      if (!groupedQueries.has(assemblyType)) {
        groupedQueries.set(assemblyType, new Map());
      }
      
      const assemblyMap = groupedQueries.get(assemblyType)!;
      if (!assemblyMap.has(sampleId || 'unknown')) {
        assemblyMap.set(sampleId || 'unknown', []);
      }
      assemblyMap.get(sampleId || 'unknown')!.push(queryId);
    }

    // Process each assembly type
    for (const [assemblyType, sampleMap] of groupedQueries) {
      const assemblyPath = `${projectPath}/results/${assemblyType}`;
      
      // Get list of sample directories
      let sampleDirs: string[] = [];
      try {
        const items = await listDirectory(assemblyPath);
        sampleDirs = items
          .filter(item => item.attrs.isDirectory())
          .map(item => item.filename);
      } catch {
        errors.push(`Assembly folder not found: ${assemblyType}`);
        continue;
      }

      for (const [sampleId, sampleQueryIds] of sampleMap) {
        // Find the right sample directory
        let targetDir = sampleId !== 'unknown' 
          ? sampleDirs.find(d => d.includes(sampleId))
          : sampleDirs[0];
        
        if (!targetDir && sampleDirs.length > 0) {
          // Try to find in any sample directory
          targetDir = sampleDirs[0];
        }
        
        if (!targetDir) {
          errors.push(`No sample directory found for ${sampleId} in ${assemblyType}`);
          continue;
        }

        // Find contigs file
        const samplePath = `${assemblyPath}/${targetDir}`;
        let contigsPath = '';
        
        try {
          const files = await listDirectory(samplePath);
          const contigsFile = files.find(f => 
            f.filename.endsWith('contigs.fa') || 
            f.filename.endsWith('contigs.fasta') ||
            f.filename.endsWith('.fa') ||
            f.filename.endsWith('.fasta')
          );
          
          if (contigsFile) {
            contigsPath = `${samplePath}/${contigsFile.filename}`;
          }
        } catch {
          errors.push(`Cannot access sample directory: ${samplePath}`);
          continue;
        }

        if (!contigsPath) {
          errors.push(`No contigs file found in ${samplePath}`);
          continue;
        }

        // Skip if already processed this file
        if (processedFiles.has(contigsPath)) {
          continue;
        }
        processedFiles.add(contigsPath);

        // Download and extract sequences
        try {
          const buffer = await downloadFile(contigsPath);
          const fastaContent = buffer.toString('utf-8');
          const extracted = extractSequencesFromFasta(fastaContent, sampleQueryIds);
          
          if (extracted.trim()) {
            extractedSequences.push(extracted);
          }
        } catch (err) {
          errors.push(`Failed to read contigs file: ${contigsPath}`);
        }
      }
    }

    const finalFasta = extractedSequences.join('\n');
    
    if (!finalFasta.trim() && errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join('; '),
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      fasta: finalFasta,
      extractedCount: (finalFasta.match(/^>/gm) || []).length,
      warnings: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to extract sequences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract sequences' },
      { status: 500 }
    );
  }
}
