import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {
    to: '/feed', label: 'Home',
    icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    to: '/search', label: 'Search',
    icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  {
    to: '/messages', label: 'Messages',
    icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    to: '/profile', label: 'My Profile',
    icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

interface Props {
  onShareBuild: () => void;
}

export default function LeftSidebar({ onShareBuild }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden lg:flex flex-col h-screen sticky top-0 w-[260px] shrink-0 border-r border-[#2f3336] px-3 py-4">
      {/* Logo */}
      <div className="px-2 mb-6 cursor-pointer" onClick={() => navigate('/feed')}>
        <Logo size={44} />
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3 py-3 rounded-2xl text-[17px] font-medium transition-all group ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-[#e7e9ea] hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-colors ${isActive ? 'text-white' : 'text-[#e7e9ea] group-hover:text-white'}`}>
                  {icon(isActive)}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Share Build CTA */}
        <button
          onClick={onShareBuild}
          className="w-full mt-4 flex items-center gap-3 px-3 py-3 rounded-2xl text-[17px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)', boxShadow: '0 4px 14px rgba(29,155,240,0.35)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <line x1="17.5" y1="14" x2="17.5" y2="21"/>
            <line x1="14" y1="17.5" x2="21" y2="17.5"/>
          </svg>
          Share a Build
        </button>
      </nav>

      {/* User profile at bottom */}
      {user && (
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/10 transition-colors mt-2"
        >
          <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={40} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[15px] text-white truncate">{user.username || user.email}</div>
            <div className="text-[13px] text-[#71767b] truncate">@{(user.username || user.email).toLowerCase().replace(/\s+/g,'_').split('@')[0]}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71767b" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </NavLink>
      )}
    </aside>
  );
}
