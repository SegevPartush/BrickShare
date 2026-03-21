import React, { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close modal"
        onClick={() => onClose?.()}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(560px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-bg p-16 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-12">
          <div>
            <div className="text-title font-semibold">{title}</div>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-transparent px-12 py-8 text-body hover:bg-white/5"
            onClick={() => onClose?.()}
          >
            סגור
          </button>
        </div>
        <div className="mt-12">{children}</div>
        {footer ? <div className="mt-16">{footer}</div> : null}
      </div>
    </div>
  );
}

