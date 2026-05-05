'use client';

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-[var(--surface-dark)] text-[var(--text-secondary)]': variant === 'default',
          'bg-[#D4EDDA] text-[#155724] dark:bg-[#052E16] dark:text-[#6EE7B7]': variant === 'success',
          'bg-[#FFF3CD] text-[#856404] dark:bg-[#422006] dark:text-[#FCD34D]': variant === 'warning',
          'bg-[#F8D7DA] text-[#721C24] dark:bg-[#450A0A] dark:text-[#FCA5A5]': variant === 'danger',
          'bg-[#CCE5FF] text-[#004085] dark:bg-[#172554] dark:text-[#93C5FD]': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}