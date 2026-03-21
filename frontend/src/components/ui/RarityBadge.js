import React from 'react';
import Badge from './Badge';

export default function RarityBadge({ rarity }) {
  // One accent only: use accent for the text/border via existing variables.
  const label = rarity || 'Rare';

  const map = {
    Legendary: 'bg-accent/10 border-accent text-fg',
    Epic: 'bg-accent/10 border-accent text-fg',
    Rare: 'bg-accent/8 border-accent text-fg'
  };

  const variantClass = map[label] || 'bg-accent/10 border-accent text-fg';

  return (
    <span className={`inline-flex items-center rounded-lg border px-10 py-6 text-caption font-semibold ${variantClass}`}>
      {label}
    </span>
  );
}

