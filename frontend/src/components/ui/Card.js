import React from 'react';

export default function Card({ className = '', children, as: As = 'div' }) {
  return (
    <As className={`rounded-lg border border-border bg-bg ${className}`.trim()}>
      {children}
    </As>
  );
}

