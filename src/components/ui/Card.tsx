'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  accentColor?: string;
  accentPosition?: 'top' | 'left';
  shadow?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  accentColor,
  accentPosition = 'top',
  shadow = true,
  hover = false,
  padding = 'md',
  className,
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        'neo-card',
        paddingStyles[padding],
        shadow && 'neo-shadow',
        hover && 'neo-card-hover',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        ...style,
        ...(accentColor
          ? {
              [`border${accentPosition === 'top' ? 'Top' : 'Left'}Width`]: '6px',
              [`border${accentPosition === 'top' ? 'Top' : 'Left'}Color`]: accentColor,
            }
          : {}),
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
