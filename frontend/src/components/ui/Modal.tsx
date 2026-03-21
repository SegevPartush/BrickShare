import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={() => onClose?.()} />
      <div className="absolute left-1/2 top-1/2 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-bg p-16 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-12">
          <div className="text-title font-semibold">{title}</div>
          <button type="button" className="rounded-lg border border-border px-12 py-8 text-body hover:bg-white/5" onClick={() => onClose?.()}>
            סגור
          </button>
        </div>
        <div className="mt-12">{children}</div>
        {footer && <div className="mt-16">{footer}</div>}
      </div>
    </div>
  );
}
