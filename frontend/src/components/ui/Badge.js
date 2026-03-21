import React from 'react';

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    neutral: 'border-border bg-white/5 text-fg',
    subtle: 'border-border bg-transparent text-fg/90'
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-10 py-6 text-caption font-semibold ${
        variants[variant] || variants.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

