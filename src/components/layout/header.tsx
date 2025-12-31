'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/projects/new': 'Create New Project',
  '/upload': 'Upload FASTQ Files',
  '/pipeline': 'Pipeline Configuration',
  '/jobs': 'Job Management',
  '/results': 'Browse Results',
  '/roadmap': 'Roadmap',
  '/help': 'Help',
  '/about': 'About',
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'NGSDiag';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">ADRDL</span>
            <span className="text-gray-400 dark:text-gray-600">|</span>
            <span className="text-gray-500 dark:text-gray-400">South Dakota State University</span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
