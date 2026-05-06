'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  const initials = fallback?.slice(0, 2).toUpperCase() || '?';

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-[#1E3A5F] flex items-center justify-center text-white font-medium',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image src={src} alt={alt || ''} fill sizes="56px" className="object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}