import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | null;
  hint?: string;
  error?: string;
  as?: 'input' | 'textarea';
}

export default function Input({ label, hint, error, as: kind = 'input', className = '', ...props }: InputProps) {
  const cls = 'w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25';

  return (
    <div className={`space-y-6 ${className}`}>
      {label && <div className="text-caption text-muted font-medium">{label}</div>}
      {kind === 'textarea' ? (
        <textarea className={`${cls} min-h-[88px] resize-none`} {...(props as any)} />
      ) : (
        <input className={cls} {...props} />
      )}
      {hint && <div className="text-caption text-muted">{hint}</div>}
      {error && <div className="text-caption text-red-400">{error}</div>}
    </div>
  );
}
