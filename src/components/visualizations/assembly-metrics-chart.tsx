'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AssemblyMetrics } from '@/types';
import { formatBytes } from '@/lib/utils';

interface AssemblyMetricsChartProps {
  metrics: AssemblyMetrics;
}

export function AssemblyMetricsChart({ metrics }: AssemblyMetricsChartProps) {
  const stats = [
    {
      label: 'Total Contigs',
      value: metrics.totalContigs.toLocaleString(),
    },
    {
      label: 'N50',
      value: formatBytes(metrics.n50),
    },
    {
      label: 'Longest Contig',
      value: formatBytes(metrics.longestContig),
    },
    {
      label: 'Total Length',
      value: formatBytes(metrics.totalLength),
    },
  ];

  // Calculate percentage for progress bars
  const maxLength = Math.max(metrics.longestContig, metrics.n50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assembly Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">N50</span>
                <span className="text-gray-900 dark:text-white">{formatBytes(metrics.n50)}</span>
              </div>
              <Progress 
                value={(metrics.n50 / maxLength) * 100} 
                variant="default"
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Longest Contig</span>
                <span className="text-gray-900 dark:text-white">{formatBytes(metrics.longestContig)}</span>
              </div>
              <Progress 
                value={(metrics.longestContig / maxLength) * 100} 
                variant="success"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
