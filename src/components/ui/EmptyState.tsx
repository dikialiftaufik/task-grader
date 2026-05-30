'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-[var(--muted-text)] mb-4">{icon}</div>
      <h3
        className="text-lg font-bold uppercase mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--muted-text)] max-w-md mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
