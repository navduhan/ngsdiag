'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaxonomicResult } from '@/types';

interface TaxonomicChartProps {
  data: TaxonomicResult[];
  title?: string;
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
];

export function TaxonomicChart({ data, title = 'Taxonomic Abundance' }: TaxonomicChartProps) {
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage).slice(0, 10);
  const maxPercentage = Math.max(...sortedData.map(d => d.percentage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No taxonomic data available
          </p>
        ) : (
          <div className="space-y-3">
            {sortedData.map((item, index) => (
              <div key={item.taxon}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">
                    {item.taxon}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.percentage.toFixed(1)}% ({item.count.toLocaleString()})
                  </span>
                </div>
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${COLORS[index % COLORS.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
