import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  onLogoClick?: () => void;
}

// Desktop nav items shown inline on large screens
const desktopNav = [
  {
    to: '/feed', label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/search', label: 'Search',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={active ? 2.5 : 2}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    to: '/messages', label: 'Messages',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: '/profile', label: 'Profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Topbar({ onLogoClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-[#2f3336]">
      <div className="mx-auto max-w-[1200px] flex items-center justify-between px-4 md:px-6 h-[60px] gap-4">
        {/* Logo + mobile menu toggle */}
        <button
          type="button"
          onClick={onLogoClick}
          className="focus:outline-none rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 md:hidden"
          aria-label="Open menu"
        >
          <Logo size={34} />
        </button>

        {/* Desktop: Logo (not clickable for menu) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Logo size={34} />
          <span className="font-extrabold text-[18px] text-white tracking-tight">BrickShare</span>
        </div>

        {/* Desktop inline nav */}
        <nav className="hidden md:flex items-center gap-1">
          {desktopNav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full text-[15px] font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-[#71767b] hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon(isActive)}
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mobile: centered title */}
        <div className="md:hidden flex-1 flex justify-center">
          <span className="font-extrabold text-[17px] text-white tracking-tight">BrickShare</span>
        </div>

        {/* Right side spacer / future actions */}
        <div className="w-[34px] md:hidden" />
      </div>
    </header>
  );
}
