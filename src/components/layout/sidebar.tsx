'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  FolderOpen,
  Upload,
  Settings2,
  PlayCircle,
  FileSearch,
  Home,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Upload Files', href: '/upload', icon: Upload },
  { name: 'Pipeline', href: '/pipeline', icon: Settings2 },
  { name: 'Jobs', href: '/jobs', icon: PlayCircle },
  { name: 'Results', href: '/results', icon: FileSearch },
  { name: 'Roadmap', href: '/roadmap', icon: Sparkles },
  { name: 'Help', href: '/help', icon: HelpCircle },
  { name: 'About', href: '/about', icon: Info },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <img 
          src="/images/logo.png" 
          alt="NGSDiag Logo" 
          className="w-full max-w-[200px] h-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>© Naveen Duhan</p>
          <p>Animal Disease Research Lab</p>
          <p>South Dakota State University</p>
        </div>
      </div>
    </aside>
  );
}
