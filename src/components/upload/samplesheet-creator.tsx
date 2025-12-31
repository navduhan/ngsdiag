'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { FileText, Plus, Trash2, Download, Save } from 'lucide-react';

interface SampleRow {
  id: string;
  reads1: string;
  reads2: string;
}

interface SamplesheetCreatorProps {
  projectPath: string;
  uploadedFiles: string[];
  onSave: (samplesheet: string) => Promise<void>;
}

// Extract sample ID from filename
function extractSampleId(filename: string): string {
  // Remove path if present
  const name = filename.split('/').pop() || filename;
  
  // Try different patterns to extract sample ID
  // Pattern 1: split on _L001 (Illumina lane)
  if (name.includes('_L001')) {
    return name.split('_L001')[0];
  }
  
  // Pattern 2: split on _R1 or _R2 (paired-end indicator)
  if (name.includes('_R1')) {
    return name.split('_R1')[0];
  }
  if (name.includes('_R2')) {
    return name.split('_R2')[0];
  }
  
  // Pattern 3: split on _1.f or _2.f (alternative paired-end)
  if (name.includes('_1.f')) {
    return name.split('_1.f')[0];
  }
  if (name.includes('_2.f')) {
    return name.split('_2.f')[0];
  }
  
  // Pattern 4: split on .fastq or .fq
  if (name.includes('.fastq')) {
    return name.split('.fastq')[0];
  }
  if (name.includes('.fq')) {
    return name.split('.fq')[0];
  }
  
  // Fallback: return filename without extension
  return name.replace(/\.(fastq|fq)(\.gz)?$/i, '');
}

// Check if file is R1/forward read
function isRead1(filename: string): boolean {
  const name = filename.toLowerCase();
  return name.includes('_r1') || name.includes('_1.f') || name.includes('_1_');
}

// Check if file is R2/reverse read
function isRead2(filename: string): boolean {
  const name = filename.toLowerCase();
  return name.includes('_r2') || name.includes('_2.f') || name.includes('_2_');
}

// Auto-pair files based on sample ID
function autoPairFiles(files: string[]): SampleRow[] {
  const sampleMap = new Map<string, { r1?: string; r2?: string }>();
  
  files.forEach(file => {
    const sampleId = extractSampleId(file);
    const existing = sampleMap.get(sampleId) || {};
    
    if (isRead1(file)) {
      existing.r1 = file;
    } else if (isRead2(file)) {
      existing.r2 = file;
    } else {
      // Single-end or unknown - treat as R1
      existing.r1 = file;
    }
    
    sampleMap.set(sampleId, existing);
  });
  
  const rows: SampleRow[] = [];
  sampleMap.forEach((reads, id) => {
    rows.push({
      id,
      reads1: reads.r1 || '',
      reads2: reads.r2 || '',
    });
  });
  
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function SamplesheetCreator({ projectPath, uploadedFiles, onSave }: SamplesheetCreatorProps) {
  const [samples, setSamples] = useState<SampleRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-pair files when component mounts or files change
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      const paired = autoPairFiles(uploadedFiles);
      setSamples(paired);
    }
  }, [uploadedFiles]);

  const addRow = () => {
    setSamples([...samples, { id: '', reads1: '', reads2: '' }]);
  };

  const removeRow = (index: number) => {
    setSamples(samples.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof SampleRow, value: string) => {
    const updated = [...samples];
    updated[index] = { ...updated[index], [field]: value };
    setSamples(updated);
  };

  // Generate CSV with full paths (for saving to server - pipeline needs full paths)
  const generateCSV = (): string => {
    const header = 'id,reads1,reads2';
    const rows = samples
      .filter(s => s.id && s.reads1) // Only include rows with ID and at least R1
      .map(s => {
        const r1Path = `${projectPath}/raw/${s.reads1}`;
        const r2Path = s.reads2 ? `${projectPath}/raw/${s.reads2}` : '';
        return `${s.id},${r1Path},${r2Path}`;
      });
    
    return [header, ...rows].join('\n');
  };

  // Generate CSV with relative paths (for preview and download - hides server paths)
  const generatePreviewCSV = (): string => {
    const header = 'id,read1,read2';
    const rows = samples
      .filter(s => s.id && s.reads1)
      .map(s => {
        const r1Path = `raw/${s.reads1}`;
        const r2Path = s.reads2 ? `raw/${s.reads2}` : '';
        return `${s.id},${r1Path},${r2Path}`;
      });
    
    return [header, ...rows].join('\n');
  };

  const handleSave = async () => {
    const validSamples = samples.filter(s => s.id && s.reads1);
    
    if (validSamples.length === 0) {
      setError('Please add at least one sample with ID and reads1');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const csv = generateCSV();
      await onSave(csv);
      setSuccess('Samplesheet saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save samplesheet');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    // Use preview CSV (relative paths) for download
    const csv = generatePreviewCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'samplesheet.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (uploadedFiles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Samplesheet
        </CardTitle>
        <CardDescription>
          Configure sample IDs and pair reads for the pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" title="Success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {samples.length} sample(s) detected
          </span>
        </div>

        {/* Table */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sample ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reads 1 (Forward)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reads 2 (Reverse)
                </th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {samples.map((sample, index) => (
                <tr key={index} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-2">
                    <Input
                      value={sample.id}
                      onChange={(e) => updateRow(index, 'id', e.target.value)}
                      placeholder="Sample ID"
                      className="h-9"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={sample.reads1}
                      onChange={(e) => updateRow(index, 'reads1', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select file...</option>
                      {uploadedFiles.map((file) => (
                        <option key={file} value={file}>{file}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={sample.reads2}
                      onChange={(e) => updateRow(index, 'reads2', e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (single-end)</option>
                      {uploadedFiles.map((file) => (
                        <option key={file} value={file}>{file}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {samples.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No files uploaded yet. Upload FASTQ files to create a samplesheet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Preview */}
        {samples.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CSV Preview
            </p>
            <pre className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
              {generatePreviewCSV()}
            </pre>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Note: Full paths are used when saving to the server for pipeline compatibility.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            Save to Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
