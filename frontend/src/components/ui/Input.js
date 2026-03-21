import React from 'react';

export default function Input({
  label,
  as,
  hint,
  className = '',
  error,
  ...props
}) {
  const kind = as === 'textarea' ? 'textarea' : 'input';
  return (
    <div className={`space-y-6 ${className}`}>
      {label ? (
        <div className="text-caption text-muted font-medium">{label}</div>
      ) : null}
      {kind === 'textarea' ? (
        <textarea
          className="w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25 min-h-[88px] resize-none"
          {...props}
        />
      ) : (
        <input
          className="w-full rounded-lg border border-border bg-transparent px-12 py-10 text-body placeholder:text-muted outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/25"
          {...props}
        />
      )}
      {hint ? <div className="text-caption text-muted">{hint}</div> : null}
      {error ? <div className="text-caption text-red-400">{error}</div> : null}
    </div>
  );
}

