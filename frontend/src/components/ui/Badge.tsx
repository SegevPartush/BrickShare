import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'subtle';
  className?: string;
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const variants = {
    neutral: 'border-border bg-white/5 text-fg',
    subtle: 'border-border bg-transparent text-fg/90',
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-10 py-6 text-caption font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
