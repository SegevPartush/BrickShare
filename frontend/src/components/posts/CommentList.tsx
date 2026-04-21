import React from 'react';
import Avatar from '../ui/Avatar';

export interface CommentItem {
  _id: string;
  text: string;
  author?: { _id?: string; id?: string; username?: string; email?: string; profileImage?: string };
  createdAt?: string;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  comments: CommentItem[];
  loading?: boolean;
  loaded?: boolean;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  avatarSize?: number;
}

// רשימת התגובות תחת פוסט - מציגה שם, תוכן, זמן וכפתור מחיקה למי שכתב
export default function CommentList({ comments, loading, loaded, currentUserId, onDelete, avatarSize = 32 }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 mb-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-white/10 rounded w-1/4" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return loaded ? <div className="text-[13px] text-[#71767b] mb-3">No comments yet. Be the first!</div> : null;
  }

  return (
    <div className="space-y-3 mb-3 max-h-[280px] overflow-y-auto">
      {comments.map((c) => {
        const name = c.author?.username || c.author?.email?.split('@')[0] || 'User';
        const authorId = c.author?.id || c.author?._id;
        const canDelete = Boolean(onDelete && currentUserId && authorId && currentUserId === authorId);
        return (
          <div key={c._id} className="flex gap-2.5">
            <div className="shrink-0">
              <Avatar name={name} imageUrl={c.author?.profileImage} size={avatarSize} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-[#1c1f23] rounded-2xl px-3 py-2">
                <span className="font-bold text-[13px] mr-1.5">{name}</span>
                <span className="text-[14px] text-white/90 leading-relaxed">{c.text}</span>
              </div>
              <div className="text-[11px] text-[#71767b] mt-1 px-1 flex items-center gap-2">
                <span>{timeAgo(c.createdAt)}</span>
                {canDelete && (
                  <>
                    <span>·</span>
                    <button type="button" onClick={() => onDelete?.(c._id)} className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
