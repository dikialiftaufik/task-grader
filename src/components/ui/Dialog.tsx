'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import Button from './Button';

export type DialogVariant = 'confirm' | 'success' | 'error' | 'info' | 'warning';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  hideCancel?: boolean;
}

const ICON_MAP: Record<DialogVariant, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  confirm: { icon: AlertTriangle, color: 'var(--yellow)', bg: '#FFFBE6' },
  success: { icon: CheckCircle, color: 'var(--green)', bg: '#E6FFF5' },
  error: { icon: XCircle, color: 'var(--red)', bg: '#FFE6E6' },
  info: { icon: Info, color: 'var(--blue)', bg: '#E6F0FF' },
  warning: { icon: AlertTriangle, color: 'var(--orange)', bg: '#FFF3E6' },
};

export default function Dialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'confirm',
  confirmText,
  cancelText = 'Batal',
  loading = false,
  hideCancel = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open && !loading) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, loading]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const { icon: IconComponent, color, bg } = ICON_MAP[variant];
  const defaultConfirmText =
    variant === 'confirm' ? 'Ya, Lanjutkan' :
    variant === 'error' ? 'Tutup' :
    variant === 'success' ? 'OK' :
    'OK';

  return (
    <div className="dialog-overlay" onClick={() => !loading && onClose()}>
      <div
        ref={dialogRef}
        className="dialog-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Close button */}
        <button
          className="dialog-close"
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="dialog-icon" style={{ background: bg }}>
          <IconComponent size={32} style={{ color }} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <h3 id="dialog-title" className="dialog-title">{title}</h3>
        <p className="dialog-message">{message}</p>

        {/* Actions */}
        <div className="dialog-actions">
          {!hideCancel && variant === 'confirm' && (
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant === 'error' ? 'secondary' : 'primary-asprak'}
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            loading={loading}
          >
            {confirmText || defaultConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ━━━━ Hook for easy usage ━━━━
import { useState, useCallback } from 'react';

interface DialogState {
  open: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText?: string;
  onConfirm?: () => void;
  loading: boolean;
  hideCancel: boolean;
}

export function useDialog() {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: '',
    message: '',
    variant: 'confirm',
    loading: false,
    hideCancel: false,
  });

  const showDialog = useCallback((opts: {
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmText?: string;
    onConfirm?: () => void;
    hideCancel?: boolean;
  }) => {
    setState({
      open: true,
      title: opts.title,
      message: opts.message,
      variant: opts.variant || 'confirm',
      confirmText: opts.confirmText,
      onConfirm: opts.onConfirm,
      loading: false,
      hideCancel: opts.hideCancel || false,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  return { dialogState: state, showDialog, closeDialog, setLoading };
}
