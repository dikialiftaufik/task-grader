'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const sizeStyles = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal content */}
      <div
        className={cn(
          'relative w-full bg-[var(--white)] border-[3px] border-[var(--dark)]',
          'shadow-[8px_8px_0px_var(--dark)] max-h-[85vh] overflow-y-auto',
          sizeStyles[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b-[3px] border-[var(--dark)]">
          <div>
            <h2
              className="text-xl font-bold uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--muted-text)]">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
