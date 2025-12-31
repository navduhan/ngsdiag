'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { 
  BarChart3, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  FileText,
} from 'lucide-react';

interface CoverageData {
  contig: string;
  length: number;
  average_coverage: number;
  total_reads: number;
}

interface CoverageTableProps {
  projectPath: string;
}

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

export function CoverageTable({ projectPath }: CoverageTableProps) {
  const [coverageFiles, setCoverageFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [results, setResults] = useState<CoverageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof CoverageData>('average_coverage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load coverage files list
  useEffect(() => {
    loadCoverageFiles();
  }, [projectPath]);

  const loadCoverageFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${projectPath}/results/coverage` }),
      });
      
      const result = await response.json();
      
      if (result.success && result.files) {
        const txtFiles = result.files
          .filter((f: any) => !f.isDirectory && (
            f.name.toLowerCase().endsWith('.txt') ||
            f.name.toLowerCase().endsWith('.tsv') ||
            f.name.toLowerCase().endsWith('.csv')
          ))
          .map((f: any) => f.name);
        setCoverageFiles(txtFiles);
        
        if (txtFiles.length > 0 && !selectedFile) {
          setSelectedFile(txtFiles[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load coverage files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load selected coverage file
  useEffect(() => {
    if (selectedFile) {
      loadCoverageData();
    }
  }, [selectedFile]);

  const loadCoverageData = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: `${projectPath}/results/coverage/${selectedFile}` 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data || []);
        setCurrentPage(1);
      } else {
        setError(result.error || 'Failed to load coverage data');
        setResults([]);
      }
    } catch (err) {
      setError('Failed to load coverage data');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort results
  const filteredResults = results
    .filter(item => 
      searchQuery === '' ||
      item.contig.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: keyof CoverageData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleDownload = () => {
    const header = 'Contig\tLength\tAverage_Coverage\tTotal_Reads';
    const rows = filteredResults.map(r => 
      `${r.contig}\t${r.length}\t${r.average_coverage}\t${r.total_reads}`
    );
    
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coverage_filtered.tsv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Calculate summary stats
  const summaryStats = {
    totalContigs: filteredResults.length,
    totalLength: filteredResults.reduce((sum, r) => sum + r.length, 0),
    avgCoverage: filteredResults.length > 0 
      ? filteredResults.reduce((sum, r) => sum + r.average_coverage, 0) / filteredResults.length 
      : 0,
    totalReads: filteredResults.reduce((sum, r) => sum + r.total_reads, 0),
  };

  // Show loading state while fetching files
  if (isLoadingFiles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Coverage Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400">Please wait, fetching results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state only after loading is complete
  if (coverageFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Coverage Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No coverage data found</p>
            <p className="text-sm">Run the pipeline to generate coverage data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Coverage Data
        </CardTitle>
        <CardDescription>
          View contig coverage statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              label="Select Coverage File"
              options={coverageFiles.map(f => ({ value: f, label: f }))}
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search contig..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Contigs</p>
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                {summaryStats.totalContigs.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400">Total Length (bp)</p>
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                {summaryStats.totalLength.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400">Avg Coverage</p>
              <p className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                {summaryStats.avgCoverage.toFixed(2)}x
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-600 dark:text-orange-400">Total Reads</p>
              <p className="text-lg font-semibold text-orange-800 dark:text-orange-300">
                {summaryStats.totalReads.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No coverage data in this file</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} contigs
              </span>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Export TSV
              </Button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {[
                        { key: 'contig', label: 'Contig' },
                        { key: 'length', label: 'Length (bp)' },
                        { key: 'average_coverage', label: 'Average Coverage' },
                        { key: 'total_reads', label: 'Total Reads' },
                      ].map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 whitespace-nowrap"
                          onClick={() => handleSort(col.key as keyof CoverageData)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginatedResults.map((item, index) => (
                      <tr 
                        key={index} 
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3 font-mono text-xs truncate max-w-[200px]" title={item.contig}>
                          {item.contig}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.length.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.average_coverage >= 30 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            item.average_coverage >= 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {item.average_coverage.toFixed(2)}x
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.total_reads.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <Select
                options={ITEMS_PER_PAGE_OPTIONS}
                value={String(itemsPerPage)}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-36"
              />
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
