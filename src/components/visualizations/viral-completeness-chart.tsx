'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViralResult } from '@/types';
import { formatBytes } from '@/lib/utils';
import { Dna, CheckCircle2, AlertCircle } from 'lucide-react';

interface ViralCompletenessChartProps {
  data: ViralResult[];
}

const getCompletenessVariant = (completeness: number): 'success' | 'warning' | 'error' => {
  if (completeness >= 90) return 'success';
  if (completeness >= 50) return 'warning';
  return 'error';
};

const getCompletenessLabel = (completeness: number): string => {
  if (completeness >= 90) return 'Complete';
  if (completeness >= 50) return 'High-quality draft';
  if (completeness >= 30) return 'Medium-quality draft';
  return 'Low-quality draft';
};

export function ViralCompletenessChart({ data }: ViralCompletenessChartProps) {
  const sortedData = [...data].sort((a, b) => b.completeness - a.completeness);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Dna className="h-5 w-5" />
          Viral Genome Completeness
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No viral genomes detected
          </p>
        ) : (
          <div className="space-y-4">
            {sortedData.map((virus, index) => (
              <div
                key={`${virus.name}-${index}`}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {virus.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Length: {formatBytes(virus.length)} | Coverage: {virus.coverage.toFixed(1)}x
                    </p>
                  </div>
                  <Badge variant={getCompletenessVariant(virus.completeness)}>
                    {getCompletenessLabel(virus.completeness)}
                  </Badge>
                </div>
                
                <div className="relative">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        virus.completeness >= 90 
                          ? 'bg-green-500' 
                          : virus.completeness >= 50 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${virus.completeness}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0%</span>
                    <span className="font-medium">{virus.completeness.toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
