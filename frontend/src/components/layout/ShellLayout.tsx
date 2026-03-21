import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LeftSidebar from './LeftSidebar';
import CreateBuildModal from '../posts/CreateBuildModal';

interface ShellLayoutProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  rightPanel?: React.ReactNode;
  showTopbar?: boolean;
}

const bottomNavItems = [
  {
    to: '/feed', label: 'Home',
    icon: (a: boolean) => <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    to: '/search', label: 'Search',
    icon: (a: boolean) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    to: '/messages', label: 'Messages',
    icon: (a: boolean) => <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    to: '/profile', label: 'Profile',
    icon: (a: boolean) => <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export default function ShellLayout({ title, subtitle, children, rightPanel, showTopbar = true }: ShellLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#000] flex">
      {/* Mobile slide-out sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Desktop left sidebar */}
      <LeftSidebar onShareBuild={() => setCreateOpen(true)} />

      {/* Main content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar only */}
        {showTopbar && (
          <div className="lg:hidden">
            <Topbar
              title={title}
              subtitle={subtitle}
              onLogoClick={() => setMobileSidebarOpen(prev => !prev)}
            />
          </div>
        )}

        {/* Content area with optional right panel */}
        <div className="flex-1 flex justify-center">
          <div className={`w-full ${rightPanel ? 'max-w-[1000px]' : 'max-w-[620px]'} flex gap-0 lg:gap-8 lg:px-0 lg:py-0`}>
            {/* Main feed column */}
            <div className="flex-1 min-w-0 border-x border-[#2f3336] pb-16 lg:pb-0">
              {children}
            </div>

            {/* Right panel */}
            {rightPanel && (
              <aside className="hidden lg:block w-[340px] shrink-0 py-4 space-y-4">
                {rightPanel}
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-t border-[#2f3336]">
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNavItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[60px] ${
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

      {/* Create Build Modal - accessible from sidebar button */}
      {createOpen && (
        <CreateBuildModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); window.location.href = '/feed'; }}
        />
      )}
    </div>
  );
}
