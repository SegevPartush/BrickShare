import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface ShellLayoutProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  rightPanel?: React.ReactNode;
  showTopbar?: boolean;
}

// פריטי הניווט - משמשים גם ב-Sidebar וגם ב-Bottom Nav
const navItems = [
  {
    to: '/feed',
    label: 'בית',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'חיפוש',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    to: '/messages',
    label: 'הודעות',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'פרופיל',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function ShellLayout({ title, subtitle, children, rightPanel, showTopbar = true }: ShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg pb-16 md:pb-0">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        {showTopbar && (
          <Topbar
            title={title}
            subtitle={subtitle}
            onLogoClick={() => setSidebarOpen(prev => !prev)}
          />
        )}

        <main className="mx-auto w-full max-w-[1200px] px-0 md:px-6 py-0 md:py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_350px]">
            <div>{children}</div>
            {rightPanel && <div className="hidden lg:block">{rightPanel}</div>}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - מוצג רק במובייל */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#2f3336]">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors ${
                  isActive ? 'text-[#1d9bf0]' : 'text-[#71767b]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon(isActive)}
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
