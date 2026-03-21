import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

export default function Card({ className = '', children, as: As = 'div' }: CardProps) {
  return (
    <As className={`rounded-lg border border-border bg-bg ${className}`.trim()}>
      {children}
    </As>
  );
}
