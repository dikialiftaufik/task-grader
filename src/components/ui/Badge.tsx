'use client';

import { cn } from '@/lib/utils';
import {
  getIndeksColor,
  getIndeksBgColor,
  getStatusColor,
  getConfidenceColor,
  getAttendanceColor,
  getDisputeStatusColor,
} from '@/lib/utils';

type BadgeVariant = 'indeks' | 'status' | 'confidence' | 'attendance' | 'dispute' | 'custom';

interface BadgeProps {
  variant?: BadgeVariant;
  value: string;
  color?: string;
  bgColor?: string;
  className?: string;
}

export default function Badge({
  variant = 'custom',
  value,
  color,
  bgColor,
  className,
}: BadgeProps) {
  let computedColor = color || 'var(--dark)';
  let computedBg = bgColor || 'var(--muted)';

  switch (variant) {
    case 'indeks':
      computedColor = getIndeksColor(value as never);
      computedBg = getIndeksBgColor(value as never);
      break;
    case 'status':
      computedColor = '#FFFFFF';
      computedBg = getStatusColor(value as never);
      break;
    case 'confidence':
      computedColor = '#FFFFFF';
      computedBg = getConfidenceColor(value as never);
      break;
    case 'attendance':
      computedColor = '#FFFFFF';
      computedBg = getAttendanceColor(value as never);
      break;
    case 'dispute':
      computedColor = '#FFFFFF';
      computedBg = getDisputeStatusColor(value as never);
      break;
  }

  return (
    <span
      className={cn('neo-pill', className)}
      style={{
        color: computedColor,
        backgroundColor: computedBg,
        borderColor: computedColor,
      }}
    >
      {value}
    </span>
  );
}
