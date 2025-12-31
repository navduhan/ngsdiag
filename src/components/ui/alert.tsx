import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

const alertVariants = {
  default: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    content: 'text-blue-700 dark:text-blue-400',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
    content: 'text-green-700 dark:text-green-400',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-300',
    content: 'text-yellow-700 dark:text-yellow-400',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
    content: 'text-red-700 dark:text-red-400',
  },
};

const alertIcons = {
  default: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

export function Alert({ className, variant = 'default', title, onClose, children, ...props }: AlertProps) {
  const Icon = alertIcons[variant];
  const styles = alertVariants[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-lg border p-4',
        styles.container,
        className
      )}
      {...props}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)} />
      <div className="flex-1">
        {title && (
          <h5 className={cn('font-medium mb-1', styles.title)}>{title}</h5>
        )}
        <div className={cn('text-sm', styles.content)}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn('absolute top-4 right-4 hover:opacity-70', styles.icon)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
