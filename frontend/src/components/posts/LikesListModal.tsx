import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';

export interface LikePerson {
  id: string;
  username: string;
  profileImage?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  people: LikePerson[];
  loading?: boolean;
  title?: string;
}

export default function LikesListModal({ open, onClose, people, loading, title = 'Likes' }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full sm:max-w-[400px] max-h-[80vh] sm:max-h-[min(80vh,480px)] sm:rounded-2xl rounded-t-2xl bg-[#16181c] border border-[#2f3336] shadow-2xl flex flex-col"
        role="dialog"
        aria-label={title}
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336] shrink-0">
          <div className="font-extrabold text-[17px] text-white">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#71767b] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-1">
          {loading && (
            <div className="px-3 py-8 text-center text-[#71767b] text-[14px]">Loading…</div>
          )}
          {!loading && people.length === 0 && (
            <div className="px-3 py-8 text-center text-[#71767b] text-[14px]">No likes to show</div>
          )}
          {!loading &&
            people.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  onClose();
                  navigate(`/profile/${p.id}`);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-white/[0.06] transition-colors"
              >
                <Avatar name={p.username} imageUrl={p.profileImage} size={44} />
                <div className="min-w-0">
                  <div className="font-bold text-[15px] text-white truncate">{p.username || 'User'}</div>
                  <div className="text-[13px] text-[#71767b]">View profile</div>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
