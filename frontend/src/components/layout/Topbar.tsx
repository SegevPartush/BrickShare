import React from 'react';
import Logo from './Logo';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onLogoClick?: () => void;
}

export default function Topbar({ right, onLogoClick }: TopbarProps) {
  return (
    <div className="sticky top-0 z-30 bg-black border-b border-[#2f3336]">
      <div className="flex items-center px-6 py-3 gap-4" style={{ direction: 'rtl' }}>
        <button
          type="button"
          onClick={onLogoClick}
          className="focus:outline-none rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          aria-label="פתח תפריט"
        >
          <Logo size={36} />
        </button>
        <div className="flex-1" style={{ direction: 'ltr' }}>{right}</div>
      </div>
    </div>
  );
}
