import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage';

export interface CoverageData {
  contig: string;
  length: number;
  average_coverage: number;
  total_reads: number;
}

function parseCoverageFile(content: string): CoverageData[] {
  const lines = content.trim().split('\n');
  const results: CoverageData[] = [];
  
  let delimiter: string | RegExp = '\t';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Detect delimiter
    if (i === 0) {
      if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(',')) {
        delimiter = ',';
      } else if (line.includes('  ')) {
        delimiter = /\s+/;
      }
    }
    
    const fields = line.split(delimiter).map(f => f.trim());
    
    // Check if header row
    if (i === 0 && (
      fields[0].toLowerCase() === 'contig' ||
      fields[0].toLowerCase().includes('contig')
    )) {
      continue;
    }
    
    // Skip comment lines
    if (line.startsWith('#')) continue;
    
    if (fields.length >= 4) {
      results.push({
        contig: fields[0] || '',
        length: parseInt(fields[1]) || 0,
        average_coverage: parseFloat(fields[2]) || 0,
        total_reads: parseInt(fields[3]) || 0,
      });
    }
  }
  
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Download the file content
    const buffer = await downloadFile(path);
    const content = buffer.toString('utf-8');
    
    // Parse coverage data
    const data = parseCoverageFile(content);

    return NextResponse.json({
      success: true,
      data,
      totalContigs: data.length,
    });
  } catch (error) {
    console.error('Failed to load coverage data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load coverage data' },
      { status: 500 }
    );
  }
}
