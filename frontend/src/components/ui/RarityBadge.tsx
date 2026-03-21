import React from 'react';

interface RarityBadgeProps {
  rarity?: string;
}

export default function RarityBadge({ rarity }: RarityBadgeProps) {
  const label = rarity || 'Rare';
  const map: Record<string, string> = {
    Legendary: 'bg-accent/10 border-accent text-fg',
    Epic: 'bg-accent/10 border-accent text-fg',
    Rare: 'bg-accent/8 border-accent text-fg',
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-10 py-6 text-caption font-semibold ${map[label] || 'bg-accent/10 border-accent text-fg'}`}>
      {label}
    </span>
  );
}
