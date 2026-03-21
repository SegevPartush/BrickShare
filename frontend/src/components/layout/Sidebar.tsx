import React from 'react';
import { NavLink } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    to: '/feed', label: 'הפיד',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    to: '/profile', label: 'פרופיל',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div
        className={`fixed z-50 w-[240px] rounded-2xl bg-[#16181c] border border-[#2f3336] shadow-2xl overflow-hidden
          transition-all duration-200 ease-out origin-top-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
        style={{ top: '62px', right: '12px' }}
      >
        <nav className="p-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive ? 'bg-[rgba(29,155,240,0.12)] text-[#1d9bf0]' : 'hover:bg-white/5 text-white'
                }`
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="my-2 border-t border-[#2f3336]" />

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-1 px-3 py-2 text-white font-semibold text-[13px] rounded-xl transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)', boxShadow: '0 2px 8px rgba(29,155,240,0.3)' }}
          >
            + שתף בניה
          </button>
        </nav>

        {user && (
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
              <Avatar name={user.username || user.email} imageUrl={user.profileImage} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold truncate text-white">{user.username || user.email}</div>
                <div className="text-[11px] text-[#71767b] truncate">{user.email}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
