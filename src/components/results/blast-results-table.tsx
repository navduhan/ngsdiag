'use client';

import { useState, useEffect, type ReactElement } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Table, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  FileText,
  Dna,
  Check,
  Settings2,
  Filter,
  X,
  Plus,
  Trash2,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface BlastHit {
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

interface BlastResultsTableProps {
  projectPath: string;
}

interface RangeFilter {
  id: string;
  column: keyof BlastHit;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
  value: string;
  value2?: string; // For 'between' operator
}

// All available columns with display names
const ALL_COLUMNS: { key: keyof BlastHit; label: string; defaultVisible: boolean; isNumeric: boolean }[] = [
  { key: 'query_id', label: 'Query ID', defaultVisible: true, isNumeric: false },
  { key: 'subject_id', label: 'Subject ID', defaultVisible: true, isNumeric: false },
  { key: 'percent_identity', label: '% Identity', defaultVisible: true, isNumeric: true },
  { key: 'alignment_length', label: 'Align Length', defaultVisible: true, isNumeric: true },
  { key: 'mismatches', label: 'Mismatches', defaultVisible: false, isNumeric: true },
  { key: 'gap_opens', label: 'Gap Opens', defaultVisible: false, isNumeric: true },
  { key: 'query_start', label: 'Query Start', defaultVisible: false, isNumeric: true },
  { key: 'query_end', label: 'Query End', defaultVisible: false, isNumeric: true },
  { key: 'subject_start', label: 'Subject Start', defaultVisible: false, isNumeric: true },
  { key: 'subject_end', label: 'Subject End', defaultVisible: false, isNumeric: true },
  { key: 'query_coverage', label: 'Query Coverage', defaultVisible: true, isNumeric: true },
  { key: 'evalue', label: 'E-value', defaultVisible: true, isNumeric: true },
  { key: 'bit_score', label: 'Bit Score', defaultVisible: true, isNumeric: true },
  { key: 'query_length', label: 'Query Length', defaultVisible: false, isNumeric: true },
  { key: 'subject_length', label: 'Subject Length', defaultVisible: false, isNumeric: true },
  { key: 'subject_title', label: 'Subject Title', defaultVisible: true, isNumeric: false },
  { key: 'tax_id', label: 'Tax ID', defaultVisible: false, isNumeric: false },
  { key: 'subject_strand', label: 'Subject Strand', defaultVisible: false, isNumeric: false },
  { key: 'sequence_length', label: 'Sequence Length', defaultVisible: false, isNumeric: true },
  { key: 'superkingdom', label: 'Superkingdom', defaultVisible: false, isNumeric: false },
  { key: 'kingdom', label: 'Kingdom', defaultVisible: false, isNumeric: false },
  { key: 'phylum', label: 'Phylum', defaultVisible: false, isNumeric: false },
  { key: 'class_name', label: 'Class', defaultVisible: false, isNumeric: false },
  { key: 'order_name', label: 'Order', defaultVisible: false, isNumeric: false },
  { key: 'family', label: 'Family', defaultVisible: false, isNumeric: false },
  { key: 'genus', label: 'Genus', defaultVisible: false, isNumeric: false },
  { key: 'species', label: 'Species', defaultVisible: true, isNumeric: false },
  { key: 'sequence', label: 'Sequence', defaultVisible: false, isNumeric: false },
];

const NUMERIC_COLUMNS = ALL_COLUMNS.filter(c => c.isNumeric);

const FILTER_OPERATORS = [
  { value: 'gt', label: 'Greater than (>)' },
  { value: 'gte', label: 'Greater than or equal (≥)' },
  { value: 'lt', label: 'Less than (<)' },
  { value: 'lte', label: 'Less than or equal (≤)' },
  { value: 'eq', label: 'Equal to (=)' },
  { value: 'between', label: 'Between' },
];

const ITEMS_PER_PAGE_OPTIONS = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
  { value: '100', label: '100 per page' },
];

const BLAST_RESULT_TYPES = [
  { value: 'all', label: 'All Results', pattern: null },
  { value: 'nr', label: 'NR Results', pattern: 'nr' },
  { value: 'nt', label: 'NT Results', pattern: 'nt' },
  { value: 'nt_viruses', label: 'NT Viruses Results', pattern: 'nt_virus' },
];

// Colors for visualization charts
const CHART_COLORS = [
  { bg: 'bg-blue-500', text: 'text-blue-500', hex: '#3b82f6' },
  { bg: 'bg-green-500', text: 'text-green-500', hex: '#22c55e' },
  { bg: 'bg-purple-500', text: 'text-purple-500', hex: '#a855f7' },
  { bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316' },
  { bg: 'bg-pink-500', text: 'text-pink-500', hex: '#ec4899' },
  { bg: 'bg-cyan-500', text: 'text-cyan-500', hex: '#06b6d4' },
  { bg: 'bg-yellow-500', text: 'text-yellow-500', hex: '#eab308' },
  { bg: 'bg-red-500', text: 'text-red-500', hex: '#ef4444' },
  { bg: 'bg-indigo-500', text: 'text-indigo-500', hex: '#6366f1' },
  { bg: 'bg-teal-500', text: 'text-teal-500', hex: '#14b8a6' },
];

interface TaxonomyCount {
  name: string;
  count: number;
  percentage: number;
  color: typeof CHART_COLORS[0];
}

export function BlastResultsTable({ projectPath }: BlastResultsTableProps) {
  const [allBlastFiles, setAllBlastFiles] = useState<string[]>([]); // All files from server
  const [blastFiles, setBlastFiles] = useState<string[]>([]); // Filtered files based on result type
  const [selectedResultType, setSelectedResultType] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [results, setResults] = useState<BlastHit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true); // Initial loading state
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [superkingdomFilter, setSuperkingdomFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<keyof BlastHit>('evalue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof BlastHit>>(
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  
  // Range filters
  const [rangeFilters, setRangeFilters] = useState<RangeFilter[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  
  // Selection for sequence extraction
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFasta, setExtractedFasta] = useState<string>('');
  const [extractWarnings, setExtractWarnings] = useState<string[]>([]);
  
  // View mode (table or visualization)
  const [viewMode, setViewMode] = useState<'table' | 'visualization'>('table');
  
  // Visualization filters
  const [vizSuperkingdomFilter, setVizSuperkingdomFilter] = useState<string>('all');
  const [vizTopCount, setVizTopCount] = useState<number>(10);

  // Get unique superkingdoms for filter dropdown
  const uniqueSuperkingdoms = Array.from(
    new Set(results.map(r => r.superkingdom).filter(s => s && s.trim() !== ''))
  ).sort();

  // Compute visualization data
  const computeTaxonomyCounts = (data: BlastHit[], field: keyof BlastHit, limit: number = 10): TaxonomyCount[] => {
    const counts: Record<string, number> = {};
    
    data.forEach(hit => {
      const value = String(hit[field] || 'Unknown').trim();
      if (value && value !== '' && value !== '-') {
        counts[value] = (counts[value] || 0) + 1;
      } else {
        counts['Unknown'] = (counts['Unknown'] || 0) + 1;
      }
    });
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    return Object.entries(counts)
      .map(([name, count], index) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  // Filter results by selected superkingdom for visualization
  const filteredVizResults = vizSuperkingdomFilter === 'all' 
    ? results 
    : results.filter(r => r.superkingdom === vizSuperkingdomFilter);

  const superkingdomData = computeTaxonomyCounts(results, 'superkingdom', 10);
  const phylumData = computeTaxonomyCounts(filteredVizResults, 'phylum', vizTopCount);
  const familyData = computeTaxonomyCounts(filteredVizResults, 'family', vizTopCount);
  const speciesData = computeTaxonomyCounts(filteredVizResults, 'species', vizTopCount);

  // Load blast files list
  useEffect(() => {
    loadBlastFiles();
  }, [projectPath]);

  const loadBlastFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `${projectPath}/results/blast_results` }),
      });
      
      const result = await response.json();
      
      if (result.success && result.files) {
        const blastFileExtensions = ['.xls', '.xlsx', '.txt', '.tsv', '.out', '.csv'];
        const txtFiles = result.files
          .filter((f: any) => !f.isDirectory && blastFileExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))
          .map((f: any) => f.name);
        setAllBlastFiles(txtFiles);
        
        // Filter based on current result type
        const filtered = filterFilesByType(txtFiles, selectedResultType);
        setBlastFiles(filtered);
        
        if (filtered.length > 0) {
          setSelectedFile(filtered[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load blast files:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Filter files based on result type
  const filterFilesByType = (files: string[], type: string): string[] => {
    const typeConfig = BLAST_RESULT_TYPES.find(t => t.value === type);
    if (!typeConfig || !typeConfig.pattern) {
      return files; // Return all files if 'all' or no pattern
    }
    
    return files.filter(f => {
      const lowerName = f.toLowerCase();
      // Special handling for 'nt' to exclude 'nt_virus' files
      if (typeConfig.value === 'nt') {
        return lowerName.includes('nt') && !lowerName.includes('virus');
      }
      return lowerName.includes(typeConfig.pattern!);
    });
  };

  // Update filtered files when result type changes
  useEffect(() => {
    const filtered = filterFilesByType(allBlastFiles, selectedResultType);
    setBlastFiles(filtered);
    
    // Auto-select first file of new type
    if (filtered.length > 0) {
      setSelectedFile(filtered[0]);
    } else {
      setSelectedFile('');
      setResults([]);
    }
  }, [selectedResultType, allBlastFiles]);

  // Load selected blast file
  useEffect(() => {
    if (selectedFile) {
      loadBlastResults();
      setSelectedRows(new Set());
    }
  }, [selectedFile]);

  const loadBlastResults = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/blast-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: `${projectPath}/results/blast_results/${selectedFile}` 
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data || []);
        setCurrentPage(1);
      } else {
        setError(result.error || 'Failed to load BLAST results');
        setResults([]);
      }
    } catch (err) {
      setError('Failed to load BLAST results');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply range filter to a single hit
  const applyRangeFilter = (hit: BlastHit, filter: RangeFilter): boolean => {
    let value: number;
    
    // Handle evalue specially since it's stored as string
    if (filter.column === 'evalue') {
      value = parseFloat(hit.evalue) || 0;
    } else {
      value = hit[filter.column] as number;
    }
    
    const filterValue = parseFloat(filter.value) || 0;
    const filterValue2 = parseFloat(filter.value2 || '0') || 0;
    
    switch (filter.operator) {
      case 'gt':
        return value > filterValue;
      case 'gte':
        return value >= filterValue;
      case 'lt':
        return value < filterValue;
      case 'lte':
        return value <= filterValue;
      case 'eq':
        return value === filterValue;
      case 'between':
        return value >= filterValue && value <= filterValue2;
      default:
        return true;
    }
  };

  // Filter and sort results
  const filteredResults = results
    .filter(hit => {
      // Superkingdom filter
      if (superkingdomFilter !== 'all' && hit.superkingdom !== superkingdomFilter) {
        return false;
      }
      
      // Text search
      if (searchQuery !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          hit.query_id.toLowerCase().includes(query) ||
          hit.subject_id.toLowerCase().includes(query) ||
          hit.subject_title.toLowerCase().includes(query) ||
          hit.species.toLowerCase().includes(query) ||
          hit.genus.toLowerCase().includes(query) ||
          hit.family.toLowerCase().includes(query) ||
          hit.phylum.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }
      
      // Range filters
      for (const filter of rangeFilters) {
        if (filter.value && !applyRangeFilter(hit, filter)) {
          return false;
        }
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

  const handleSort = (column: keyof BlastHit) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (column: keyof BlastHit) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(column)) {
      if (column !== 'query_id') {
        newVisible.delete(column);
      }
    } else {
      newVisible.add(column);
    }
    setVisibleColumns(newVisible);
  };

  const selectAllColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.map(c => c.key)));
  };

  const selectDefaultColumns = () => {
    setVisibleColumns(new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key)));
  };

  // Range filter management
  const addRangeFilter = () => {
    const newFilter: RangeFilter = {
      id: `filter-${Date.now()}`,
      column: 'percent_identity',
      operator: 'gte',
      value: '',
    };
    setRangeFilters([...rangeFilters, newFilter]);
  };

  const updateRangeFilter = (id: string, updates: Partial<RangeFilter>) => {
    setRangeFilters(rangeFilters.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const removeRangeFilter = (id: string) => {
    setRangeFilters(rangeFilters.filter(f => f.id !== id));
  };

  const clearAllFilters = () => {
    setRangeFilters([]);
    setCurrentPage(1);
  };

  const toggleRowSelection = (queryId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(queryId)) {
      newSelected.delete(queryId);
    } else {
      newSelected.add(queryId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedResults.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedResults.map(r => r.query_id)));
    }
  };

  const handleExtractSequences = async () => {
    if (selectedRows.size === 0) return;
    
    setIsExtracting(true);
    setExtractedFasta('');
    setExtractWarnings([]);
    
    try {
      const response = await fetch('/api/extract-sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          queryIds: Array.from(selectedRows),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setExtractedFasta(result.fasta);
        if (result.warnings) {
          setExtractWarnings(result.warnings);
        }
      } else {
        setError(result.error || 'Failed to extract sequences');
      }
    } catch (err) {
      setError('Failed to extract sequences');
    } finally {
      setIsExtracting(false);
    }
  };

  const downloadExtractedFasta = () => {
    const blob = new Blob([extractedFasta], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_sequences.fasta';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownload = () => {
    const visibleCols = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));
    const header = visibleCols.map(c => c.label).join('\t');
    const rows = filteredResults.map(r => 
      visibleCols.map(c => {
        const val = r[c.key];
        return val !== undefined && val !== null ? String(val) : '';
      }).join('\t')
    );
    
    const content = [header, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blast_results_filtered.tsv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatCellValue = (hit: BlastHit, column: keyof BlastHit) => {
    const value = hit[column];
    
    switch (column) {
      case 'percent_identity':
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            (value as number) >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            (value as number) >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {(value as number).toFixed(1)}%
          </span>
        );
      case 'query_coverage':
        return `${(value as number).toFixed(1)}%`;
      case 'bit_score':
        return (value as number).toFixed(1);
      case 'evalue':
        return <span className="font-mono text-xs">{value}</span>;
      case 'query_id':
      case 'subject_id':
        return (
          <span className="font-mono text-xs truncate max-w-[150px] block" title={String(value)}>
            {value}
          </span>
        );
      case 'species':
      case 'genus':
        return <span className="italic">{value || '-'}</span>;
      case 'subject_title':
      case 'sequence':
        return (
          <span className="truncate max-w-[200px] block" title={String(value)}>
            {value || '-'}
          </span>
        );
      default:
        return value !== undefined && value !== null && value !== '' ? String(value) : '-';
    }
  };

  const getActiveFilterCount = () => rangeFilters.filter(f => f.value).length;

  // Show loading state while fetching files
  if (isLoadingFiles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            BLAST Results
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
  if (blastFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            BLAST Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No BLAST results found</p>
            <p className="text-sm">Run the pipeline to generate BLAST results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          BLAST Results
        </CardTitle>
        <CardDescription>
          View, search, filter, and extract sequences from BLAST results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4">
          {/* Result Type and File Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <Select
                label="Result Type"
                options={BLAST_RESULT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                value={selectedResultType}
                onChange={(e) => setSelectedResultType(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                label="Select BLAST File"
                options={blastFiles.length > 0 
                  ? blastFiles.map(f => ({ value: f, label: f }))
                  : [{ value: '', label: 'No files found for this type' }]
                }
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                disabled={blastFiles.length === 0}
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Superkingdom
              </label>
              <select
                value={superkingdomFilter}
                onChange={(e) => {
                  setSuperkingdomFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Superkingdoms</option>
                {uniqueSuperkingdoms.map(sk => (
                  <option key={sk} value={sk}>{sk}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search and Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search query, subject, species..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setFilterModalOpen(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setColumnModalOpen(true)}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Columns
              </Button>
            </div>
          </div>

          {/* Active Superkingdom Filter Indicator */}
          {superkingdomFilter !== 'all' && (
            <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-sm text-purple-800 dark:text-purple-300">
                Filtering by: <strong>{superkingdomFilter}</strong> ({filteredResults.length} hits)
              </span>
              <button 
                onClick={() => setSuperkingdomFilter('all')}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {rangeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
            {rangeFilters.map(filter => {
              const colLabel = ALL_COLUMNS.find(c => c.key === filter.column)?.label || filter.column;
              const opLabel = FILTER_OPERATORS.find(o => o.value === filter.operator)?.label.split(' ')[0] || filter.operator;
              return (
                <span 
                  key={filter.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                >
                  {colLabel} {opLabel} {filter.value}
                  {filter.operator === 'between' && filter.value2 && ` - ${filter.value2}`}
                  <button 
                    onClick={() => removeRangeFilter(filter.id)}
                    className="ml-1 hover:text-blue-600 dark:hover:text-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs">
              Clear All
            </Button>
          </div>
        )}

        {/* Selection actions */}
        {selectedRows.size > 0 && viewMode === 'table' && (
          <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-sm text-blue-800 dark:text-blue-300">
              {selectedRows.size} sequence(s) selected
            </span>
            <Button 
              size="sm" 
              onClick={() => setExtractModalOpen(true)}
              className="gap-2"
            >
              <Dna className="h-4 w-4" />
              Extract Sequences
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedRows(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        )}

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'visualization')}>
          <TabsList className="mb-4">
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="visualization" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visualization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No BLAST results in this file</p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
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
                      <th className="px-3 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === paginatedResults.length && paginatedResults.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </th>
                      {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                        <th
                          key={col.key}
                          className="px-3 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 whitespace-nowrap"
                          onClick={() => handleSort(col.key)}
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
                    {paginatedResults.map((hit, index) => (
                      <tr 
                        key={index} 
                        className={`bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                          selectedRows.has(hit.query_id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(hit.query_id)}
                            onChange={() => toggleRowSelection(hit.query_id)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                        </td>
                        {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                          <td key={col.key} className="px-3 py-3 text-gray-600 dark:text-gray-400">
                            {formatCellValue(hit, col.key)}
                          </td>
                        ))}
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

          <TabsContent value="visualization">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No data to visualize</p>
                <p className="text-sm">Load BLAST results to see visualizations</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visualization Filters */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="sm:w-64">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Filter by Superkingdom
                    </label>
                    <select
                      value={vizSuperkingdomFilter}
                      onChange={(e) => setVizSuperkingdomFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All Superkingdoms</option>
                      {uniqueSuperkingdoms.map(sk => (
                        <option key={sk} value={sk}>{sk}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:w-40">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Show Top
                    </label>
                    <select
                      value={vizTopCount}
                      onChange={(e) => setVizTopCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                      <option value={15}>Top 15</option>
                      <option value={20}>Top 20</option>
                    </select>
                  </div>
                  {vizSuperkingdomFilter !== 'all' && (
                    <div className="flex items-end">
                      <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
                        Showing {filteredVizResults.length.toLocaleString()} hits from <strong>{vizSuperkingdomFilter}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Hits</p>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                      {results.length.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Unique Queries</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                      {new Set(results.map(r => r.query_id)).size.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Unique Species</p>
                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                      {new Set(results.map(r => r.species).filter(s => s && s !== '')).size.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Avg % Identity</p>
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">
                      {(results.reduce((sum, r) => sum + r.percent_identity, 0) / results.length).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Superkingdom Distribution */}
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Superkingdom Distribution
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="flex items-center justify-center">
                      <div className="relative w-48 h-48">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                          {superkingdomData.reduce((acc, item, index) => {
                            const startAngle = acc.angle;
                            const angle = (item.percentage / 100) * 360;
                            const endAngle = startAngle + angle;
                            
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            
                            const x1 = 50 + 40 * Math.cos(startRad);
                            const y1 = 50 + 40 * Math.sin(startRad);
                            const x2 = 50 + 40 * Math.cos(endRad);
                            const y2 = 50 + 40 * Math.sin(endRad);
                            
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            acc.elements.push(
                              <path
                                key={item.name}
                                d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={item.color.hex}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                <title>{item.name}: {item.count} ({item.percentage.toFixed(1)}%)</title>
                              </path>
                            );
                            
                            acc.angle = endAngle;
                            return acc;
                          }, { elements: [] as ReactElement[], angle: 0 }).elements}
                          {/* Inner circle for donut effect */}
                          <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-900" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Legend */}
                    <div className="space-y-2">
                      {superkingdomData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${item.color.bg}`} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.count.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Phyla */}
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Top {vizTopCount} Phyla
                    {vizSuperkingdomFilter !== 'all' && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({vizSuperkingdomFilter})
                      </span>
                    )}
                  </h3>
                  <div className="space-y-3">
                    {phylumData.slice(0, 8).map((item) => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color.bg} rounded-full transition-all duration-500`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Families and Species side by side */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Families */}
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Top {vizTopCount} Families
                      {vizSuperkingdomFilter !== 'all' && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          ({vizSuperkingdomFilter})
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {familyData.slice(0, 8).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color.bg} rounded-full`}
                                style={{ width: `${(item.count / familyData[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Species */}
                  <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Top {vizTopCount} Species
                      {vizSuperkingdomFilter !== 'all' && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          ({vizSuperkingdomFilter})
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {speciesData.slice(0, 8).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 italic truncate max-w-[150px]" title={item.name}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color.bg} rounded-full`}
                                style={{ width: `${(item.count / speciesData[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                              {item.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Filter Modal */}
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Range Filters"
        description="Filter results by numeric column values"
        size="lg"
      >
        <div className="space-y-4">
          {rangeFilters.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No filters added</p>
              <p className="text-sm">Click the button below to add a filter</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rangeFilters.map((filter, index) => (
                <div key={filter.id} className="flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Column
                    </label>
                    <select
                      value={filter.column}
                      onChange={(e) => updateRangeFilter(filter.id, { column: e.target.value as keyof BlastHit })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      {NUMERIC_COLUMNS.map(col => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Operator
                    </label>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateRangeFilter(filter.id, { operator: e.target.value as RangeFilter['operator'] })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      {FILTER_OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={filter.operator === 'between' ? 'flex-1' : 'flex-1'}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {filter.operator === 'between' ? 'Min Value' : 'Value'}
                    </label>
                    <Input
                      type="number"
                      step="any"
                      value={filter.value}
                      onChange={(e) => updateRangeFilter(filter.id, { value: e.target.value })}
                      placeholder="Enter value"
                    />
                  </div>
                  {filter.operator === 'between' && (
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Max Value
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={filter.value2 || ''}
                        onChange={(e) => updateRangeFilter(filter.id, { value2: e.target.value })}
                        placeholder="Enter max"
                      />
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRangeFilter(filter.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={addRangeFilter} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Filter
            </Button>
            <div className="flex gap-2">
              {rangeFilters.length > 0 && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
              <Button onClick={() => {
                setFilterModalOpen(false);
                setCurrentPage(1);
              }}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Column Selection Modal */}
      <Modal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        title="Select Columns"
        description="Choose which columns to display in the table"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAllColumns}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectDefaultColumns}>
              Reset to Default
            </Button>
          </div>
          
          <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-1 p-2">
              {ALL_COLUMNS.map(col => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    visibleColumns.has(col.key) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(col.key)}
                    onChange={() => toggleColumnVisibility(col.key)}
                    disabled={col.key === 'query_id'}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {col.label}
                    {col.key === 'query_id' && (
                      <span className="text-xs text-gray-500 ml-1">(required)</span>
                    )}
                    {col.isNumeric && (
                      <span className="text-xs text-blue-500 ml-1">(numeric)</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setColumnModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Extract Sequences Modal */}
      <Modal
        isOpen={extractModalOpen}
        onClose={() => {
          setExtractModalOpen(false);
          setExtractedFasta('');
          setExtractWarnings([]);
        }}
        title="Extract Sequences"
        description={`Extract ${selectedRows.size} sequence(s) from assembly contigs`}
        size="lg"
      >
        <div className="space-y-4">
          {!extractedFasta ? (
            <>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected Query IDs ({selectedRows.size}):
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Array.from(selectedRows).map(id => (
                    <code key={id} className="block text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {id}
                    </code>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assembly type will be auto-detected from query IDs (hybrid, megahit, or metaspades).
              </p>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setExtractModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExtractSequences} isLoading={isExtracting} className="gap-2">
                  <Dna className="h-4 w-4" />
                  Extract
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Successfully extracted {(extractedFasta.match(/^>/gm) || []).length} sequence(s)
                </p>
              </div>
              
              {extractWarnings.length > 0 && (
                <Alert variant="warning" title="Warnings">
                  <ul className="list-disc list-inside text-sm">
                    {extractWarnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FASTA Output:
                </p>
                <pre className="p-4 rounded-lg bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs overflow-auto max-h-64 font-mono">
                  {extractedFasta}
                </pre>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setExtractModalOpen(false);
                  setExtractedFasta('');
                  setExtractWarnings([]);
                }}>
                  Close
                </Button>
                <Button onClick={downloadExtractedFasta} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download FASTA
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Card>
  );
}
