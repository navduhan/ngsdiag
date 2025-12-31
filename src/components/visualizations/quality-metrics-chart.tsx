'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QualityMetrics } from '@/types';
import { BarChart3, FileText, Dna, Copy } from 'lucide-react';

interface QualityMetricsChartProps {
  metrics: QualityMetrics;
}

export function QualityMetricsChart({ metrics }: QualityMetricsChartProps) {
  const stats = [
    {
      label: 'Total Reads',
      value: metrics.totalReads.toLocaleString(),
      icon: FileText,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Quality Score',
      value: metrics.qualityScore.toFixed(1),
      icon: BarChart3,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      label: 'GC Content',
      value: `${metrics.gcContent.toFixed(1)}%`,
      icon: Dna,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Duplicate Rate',
      value: `${metrics.duplicateRate.toFixed(1)}%`,
      icon: Copy,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quality Control Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex p-3 rounded-xl ${stat.color} mb-2`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
