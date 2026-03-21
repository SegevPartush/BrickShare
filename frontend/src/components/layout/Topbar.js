import React from 'react';
import Logo from './Logo';

export default function Topbar({ title, subtitle, right, onLogoClick }) {
  return (
    <div className="sticky top-0 z-30 bg-black border-b border-[#2f3336]">
      <div
        className="flex items-center px-6 py-3 gap-4"
        style={{ direction: 'rtl' }}
      >
        {/* Logo on the RIGHT (first in RTL flow) */}
        <button
          type="button"
          onClick={onLogoClick}
          className="focus:outline-none rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          aria-label="פתח תפריט"
        >
          <Logo size={36} />
        </button>

        {/* Rest of the topbar fills the remaining space */}
        <div className="flex-1" style={{ direction: 'ltr' }}>
          {right}
        </div>
      </div>
    </div>
  );
}
