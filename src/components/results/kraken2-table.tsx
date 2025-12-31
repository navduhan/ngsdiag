'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Bug, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  FileText,
  ChevronRight as ChevronRightIcon,
  PieChart,
  Table,
  Maximize2,
  X,
} from 'lucide-react';

interface Kraken2Result {
  percentage: number;
  reads_clade: number;
  reads_direct: number;
  rank: string;
  rank_name: string;
  tax_id: string;
  name: string;
  depth: number;
}

interface Summary {
  totalReads: number;
  classifiedReads: number;
  unclassifiedReads: number;
  classifiedPercent: number;
  unclassifiedPercent: number;
}

interface Kraken2TableProps {
  projectPath: string;
}

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
  { value: '250', label: '250 per page' },
];

const RANK_FILTER_OPTIONS = [
  { value: 'all', label: 'All Ranks' },
  { value: 'D', label: 'Domain' },
  { value: 'K', label: 'Kingdom' },
  { value: 'P', label: 'Phylum' },
  { value: 'C', label: 'Class' },
  { value: 'O', label: 'Order' },
  { value: 'F', label: 'Family' },
  { value: 'G', label: 'Genus' },
  { value: 'S', label: 'Species' },
];

const RANK_COLORS: Record<string, string> = {
  'U': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  'R': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'D': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'K': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'P': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'C': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'O': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'F': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  'G': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'S': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export function Kraken2Table({ projectPath }: Kraken2TableProps) {
  const [reportFiles, setReportFiles] = useState<string[]>([]);
  const [kronaFiles, setKronaFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedKronaFile, setSelectedKronaFile] = useState<string>('');
  const [results, setResults] = useState<Kraken2Result[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingKrona, setIsLoadingKrona] = useState(false);
  const [kronaHtml, setKronaHtml] = useState<string>('');
  const [isKronaFullscreen, setIsKronaFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [rankFilter, setRankFilter] = useState('all');
  const [minPercentage, setMinPercentage] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Kraken2Result>('percentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load report files list
  useEffect(() => {
    loadReportFiles();
  }, [projectPath]);

  const loadReportFiles = async () => {
    setIsLoadingFiles(true);
    try {
      // Load Kraken2 report files
      const krakenResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${projectPath}/results/kraken2_results` }),
      });
      
      const krakenResult = await krakenResponse.json();
      
      if (krakenResult.success && krakenResult.files) {
        // Filter for report files only
        const reports = krakenResult.files
          .filter((f: any) => !f.isDirectory && f.name.toLowerCase().includes('report') && f.name.toLowerCase().endsWith('.txt'))
          .map((f: any) => f.name);
        setReportFiles(reports);
        
        if (reports.length > 0) {
          setSelectedFile(reports[0]);
        }
      }
      
      // Load Krona HTML files from krona_results folder
      const kronaResponse = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${projectPath}/results/krona_results` }),
      });
      
      const kronaResult = await kronaResponse.json();
      
      if (kronaResult.success && kronaResult.files) {
        const kronas = kronaResult.files
          .filter((f: any) => !f.isDirectory && f.name.toLowerCase().endsWith('.html'))
          .map((f: any) => f.name);
        setKronaFiles(kronas);
        
        if (kronas.length > 0) {
          setSelectedKronaFile(kronas[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load kraken2/krona files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load Krona HTML when selected
  useEffect(() => {
    if (selectedKronaFile) {
      loadKronaPlot();
    }
  }, [selectedKronaFile]);

  const loadKronaPlot = async () => {
    if (!selectedKronaFile) return;
    
    setIsLoadingKrona(true);
    try {
      const response = await fetch('/api/krona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: `${projectPath}/results/krona_results/${selectedKronaFile}` 
        }),
      });
      
      if (response.ok) {
        const html = await response.text();
        setKronaHtml(html);
      } else {
        setError('Failed to load Krona plot');
      }
    } catch (err) {
      console.error('Failed to load Krona plot:', err);
    } finally {
      setIsLoadingKrona(false);
    }
  };

  // Load selected report file
  useEffect(() => {
    if (selectedFile) {
      loadKraken2Results();
    }
  }, [selectedFile]);

  const loadKraken2Results = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kraken2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: `${projectPath}/results/kraken2_results/${selectedFile}` 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data || []);
        setSummary(result.summary || null);
        setCurrentPage(1);
      } else {
        setError(result.error || 'Failed to load Kraken2 results');
        setResults([]);
        setSummary(null);
      }
    } catch (err) {
      setError('Failed to load Kraken2 results');
      setResults([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort results
  const filteredResults = results
    .filter(item => {
      // Skip unclassified and root for cleaner display unless searching
      if (!searchQuery && (item.rank === 'U' || item.rank === 'R')) return false;
      
      // Text search
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Rank filter
      if (rankFilter !== 'all' && item.rank !== rankFilter) {
        return false;
      }
      
      // Min percentage filter
      if (minPercentage && item.percentage < parseFloat(minPercentage)) {
        return false;
      }
      
      return true;
    })
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

  const handleSort = (column: keyof Kraken2Result) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleDownload = () => {
    const header = 'Percentage\tReads (Clade)\tReads (Direct)\tRank\tTax ID\tName';
    const rows = filteredResults.map(r => 
      `${r.percentage}\t${r.reads_clade}\t${r.reads_direct}\t${r.rank_name}\t${r.tax_id}\t${r.name}`
    );
    
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kraken2_results_filtered.tsv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Show loading state while fetching files
  if (isLoadingFiles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Kraken2 Taxonomic Classification
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
  if (reportFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Kraken2 Taxonomic Classification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No Kraken2 results found</p>
            <p className="text-sm">Run the pipeline to generate taxonomic classification results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Kraken2 Taxonomic Classification
        </CardTitle>
        <CardDescription>
          View taxonomic classification results and interactive Krona plots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs defaultValue="table">
          <TabsList className="mb-4">
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="krona" className="gap-2" disabled={kronaFiles.length === 0}>
              <PieChart className="h-4 w-4" />
              Krona Plot {kronaFiles.length > 0 && `(${kronaFiles.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            {/* File Selection */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  label="Select Report File"
                  options={reportFiles.length > 0 
                    ? reportFiles.map(f => ({ value: f, label: f }))
                    : [{ value: '', label: 'No report files found' }]
                  }
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                  disabled={reportFiles.length === 0}
                />
              </div>
            </div>

            {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">Total Reads</p>
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                {summary.totalReads.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-600 dark:text-green-400">Classified</p>
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                {summary.classifiedReads.toLocaleString()} ({summary.classifiedPercent.toFixed(1)}%)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">Unclassified</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-300">
                {summary.unclassifiedReads.toLocaleString()} ({summary.unclassifiedPercent.toFixed(1)}%)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-400">Total Taxa</p>
              <p className="text-lg font-semibold text-purple-800 dark:text-purple-300">
                {results.length.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Search Taxa
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="sm:w-40">
            <Select
              label="Rank"
              options={RANK_FILTER_OPTIONS}
              value={rankFilter}
              onChange={(e) => {
                setRankFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="sm:w-40">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Min %
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g., 0.1"
              value={minPercentage}
              onChange={(e) => {
                setMinPercentage(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400">Loading report...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No results in this file</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} taxa
                {filteredResults.length !== results.length && (
                  <span className="ml-1">(filtered from {results.length})</span>
                )}
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
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        onClick={() => handleSort('percentage')}
                      >
                        <div className="flex items-center gap-1">
                          Percentage
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        onClick={() => handleSort('reads_clade')}
                      >
                        <div className="flex items-center gap-1">
                          Reads (Clade)
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        onClick={() => handleSort('reads_direct')}
                      >
                        <div className="flex items-center gap-1">
                          Reads (Direct)
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Tax ID
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Scientific Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginatedResults.map((item, index) => (
                      <tr 
                        key={index} 
                        className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(item.percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {item.percentage.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.reads_clade.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {item.reads_direct.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${RANK_COLORS[item.rank] || RANK_COLORS['U']}`}>
                            {item.rank_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {item.tax_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {item.depth > 0 && (
                              <span className="text-gray-300 dark:text-gray-600" style={{ paddingLeft: `${item.depth * 12}px` }}>
                                <ChevronRightIcon className="h-3 w-3 inline" />
                              </span>
                            )}
                            <span className={`${item.rank === 'S' || item.rank === 'G' ? 'italic' : ''} text-gray-900 dark:text-gray-100`}>
                              {item.name}
                            </span>
                          </div>
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
          </TabsContent>

          <TabsContent value="krona" className="space-y-4">
            {kronaFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No Krona plots found</p>
                <p className="text-sm">Run the pipeline with Krona enabled to generate interactive plots</p>
              </div>
            ) : (
              <>
                {/* Krona File Selection */}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Select
                      label="Select Krona Plot"
                      options={kronaFiles.map(f => ({ value: f, label: f }))}
                      value={selectedKronaFile}
                      onChange={(e) => setSelectedKronaFile(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsKronaFullscreen(true)}
                    className="gap-2"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Fullscreen
                  </Button>
                </div>

                {/* Krona Plot Viewer */}
                {isLoadingKrona ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Spinner size="lg" />
                    <p className="text-gray-500 dark:text-gray-400">Loading Krona plot...</p>
                  </div>
                ) : kronaHtml ? (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={kronaHtml}
                      className="w-full bg-white"
                      style={{ height: '600px' }}
                      title="Krona Plot"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a Krona plot to view</p>
                  </div>
                )}

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p><strong>Tip:</strong> Click on segments in the Krona chart to zoom in. Use the center to zoom out.</p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Fullscreen Krona Modal */}
      {isKronaFullscreen && kronaHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="relative w-full h-full bg-white">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white shadow-lg"
              onClick={() => setIsKronaFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <iframe
              srcDoc={kronaHtml}
              className="w-full h-full"
              title="Krona Plot Fullscreen"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
