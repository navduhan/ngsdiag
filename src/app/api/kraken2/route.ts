import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage';

export interface Kraken2Result {
  percentage: number;
  reads_clade: number;
  reads_direct: number;
  rank: string;
  rank_name: string;
  tax_id: string;
  name: string;
  depth: number;
}

// Rank code to full name mapping
const RANK_NAMES: Record<string, string> = {
  'U': 'Unclassified',
  'R': 'Root',
  'D': 'Domain',
  'K': 'Kingdom',
  'P': 'Phylum',
  'C': 'Class',
  'O': 'Order',
  'F': 'Family',
  'G': 'Genus',
  'S': 'Species',
  'S1': 'Subspecies',
  'S2': 'Strain',
};

function parseKraken2Report(content: string): Kraken2Result[] {
  const lines = content.trim().split('\n');
  const results: Kraken2Result[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Kraken2 report format: percentage, reads_clade, reads_direct, rank, tax_id, name
    // The name has leading spaces to indicate hierarchy depth
    const parts = line.split('\t');
    
    if (parts.length >= 6) {
      const name = parts[5];
      // Count leading spaces to determine depth (2 spaces per level)
      const leadingSpaces = name.match(/^(\s*)/)?.[1]?.length || 0;
      const depth = Math.floor(leadingSpaces / 2);
      
      results.push({
        percentage: parseFloat(parts[0]) || 0,
        reads_clade: parseInt(parts[1]) || 0,
        reads_direct: parseInt(parts[2]) || 0,
        rank: parts[3] || '',
        rank_name: RANK_NAMES[parts[3]] || parts[3] || 'Unknown',
        tax_id: parts[4] || '',
        name: name.trim(),
        depth,
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
    
    // Parse Kraken2 report
    const data = parseKraken2Report(content);
    
    // Calculate summary stats
    const unclassified = data.find(d => d.rank === 'U');
    const classified = data.find(d => d.rank === 'R');
    
    const summary = {
      totalReads: (unclassified?.reads_clade || 0) + (classified?.reads_clade || 0),
      classifiedReads: classified?.reads_clade || 0,
      unclassifiedReads: unclassified?.reads_clade || 0,
      classifiedPercent: classified?.percentage || 0,
      unclassifiedPercent: unclassified?.percentage || 0,
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      totalTaxa: data.length,
    });
  } catch (error) {
    console.error('Failed to load Kraken2 results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load Kraken2 results' },
      { status: 500 }
    );
  }
}
