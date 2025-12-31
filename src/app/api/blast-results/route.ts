import { NextRequest, NextResponse } from 'next/server';
import { downloadFile } from '@/lib/storage';

export interface BlastHit {
  query_id: string;
  subject_id: string;
  percent_identity: number;
  alignment_length: number;
  mismatches: number;
  gap_opens: number;
  query_start: number;
  query_end: number;
  subject_start: number;
  subject_end: number;
  query_coverage: number;
  evalue: string;
  bit_score: number;
  query_length: number;
  subject_length: number;
  subject_title: string;
  tax_id: string;
  subject_strand: string;
  sequence_length: number;
  superkingdom: string;
  kingdom: string;
  phylum: string;
  class_name: string;
  order_name: string;
  family: string;
  genus: string;
  species: string;
  sequence: string;
}

function parseBlastOutput(content: string): BlastHit[] {
  const lines = content.trim().split('\n');
  const results: BlastHit[] = [];
  
  let delimiter = '\t';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Detect delimiter (tab or comma)
    if (i === 0) {
      if (line.includes('\t')) {
        delimiter = '\t';
      } else if (line.includes(',')) {
        delimiter = ',';
      }
    }
    
    const fields = line.split(delimiter).map(f => f.trim());
    
    // Check if this is a header row
    if (i === 0 && (
      fields[0].toLowerCase().includes('query') || 
      fields[0].toLowerCase().includes('qseqid') ||
      fields[0].toLowerCase() === 'id'
    )) {
      continue;
    }
    
    // Skip comment lines
    if (line.startsWith('#')) continue;
    
    // Parse data row with all columns
    // Columns: query_id, subject_id, percent_identity, alignment_length, mismatches, gap_opens, 
    //          query_start, query_end, subject_start, subject_end, query_coverage, evalue, bit_score,
    //          query_length, subject_length, subject_title, tax_id, subject_strand, sequence_length,
    //          superkingdom, kingdom, phylum, class, order, family, genus, species, sequence
    if (fields.length >= 2) {
      results.push({
        query_id: fields[0] || '',
        subject_id: fields[1] || '',
        percent_identity: parseFloat(fields[2]) || 0,
        alignment_length: parseInt(fields[3]) || 0,
        mismatches: parseInt(fields[4]) || 0,
        gap_opens: parseInt(fields[5]) || 0,
        query_start: parseInt(fields[6]) || 0,
        query_end: parseInt(fields[7]) || 0,
        subject_start: parseInt(fields[8]) || 0,
        subject_end: parseInt(fields[9]) || 0,
        query_coverage: parseFloat(fields[10]) || 0,
        evalue: fields[11] || '0',
        bit_score: parseFloat(fields[12]) || 0,
        query_length: parseInt(fields[13]) || 0,
        subject_length: parseInt(fields[14]) || 0,
        subject_title: fields[15] || '',
        tax_id: fields[16] || '',
        subject_strand: fields[17] || '',
        sequence_length: parseInt(fields[18]) || 0,
        superkingdom: fields[19] || '',
        kingdom: fields[20] || '',
        phylum: fields[21] || '',
        class_name: fields[22] || '',
        order_name: fields[23] || '',
        family: fields[24] || '',
        genus: fields[25] || '',
        species: fields[26] || '',
        sequence: fields[27] || '',
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
    
    // Parse BLAST results
    const data = parseBlastOutput(content);

    return NextResponse.json({
      success: true,
      data,
      totalHits: data.length,
    });
  } catch (error) {
    console.error('Failed to load BLAST results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load BLAST results' },
      { status: 500 }
    );
  }
}
