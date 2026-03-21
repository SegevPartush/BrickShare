import React, { useState } from 'react';
import Avatar from '../ui/Avatar';
import { Post } from '../../types';

export interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onToggleLike?: (postId: string) => void;
  matchReason?: string;
}

// פורמט תאריך יחסי בעברית
function formatDate(iso?: string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'עכשיו';
  if (mins < 60) return `${mins}ד'`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ש'`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}י'`;
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

// בדיקה אם המשתמש הנוכחי נתן לייק
function isLikedByUser(post: Post, userId?: string): boolean {
  if (!userId) return false;
  return post.likes.some((u: any) => {
    const id = u?.id || u?._id || u;
    return typeof id === 'string' ? id === userId : id?.toString?.() === userId;
  });
}

export default function PostCard({ post, currentUserId, onToggleLike, matchReason }: PostCardProps) {
  const [retweeted, setRetweeted] = useState(false);
  const [shared, setShared] = useState(false);

  const liked = isLikedByUser(post, currentUserId);
  const likesCount = post.likes?.length || 0;
  const commentsCount = post.commentCount || 0;
  const authorName = post.author?.username || post.author?.email || 'משתמש';
  const authorHandle = '@' + (post.author?.username?.toLowerCase() || 'user');

  // העתקת קישור לשיתוף
  function handleShare() {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <article className="border-b border-[#2f3336] px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
      <div className="flex gap-3">
        {/* אווטר */}
        <div className="shrink-0">
          <Avatar
            name={authorName}
            imageUrl={post.author?.profileImage}
            size={44}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* שורת שם + תאריך */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-[15px] hover:underline cursor-pointer">
              {authorName}
            </span>
            <span className="text-[#71767b] text-[15px]">{authorHandle}</span>
            <span className="text-[#71767b] text-[15px]">·</span>
            <span className="text-[#71767b] text-[14px]">{formatDate(post.createdAt)}</span>
          </div>

          {/* אינדיקטור התאמה מ-AI */}
          {matchReason && (
            <div className="text-[12px] text-[#71767b] mt-1">
              ✨ {matchReason}
            </div>
          )}

          {/* תוכן הפוסט */}
          {post.text && (
            <div className="text-[15px] leading-[1.5] mt-1 whitespace-pre-wrap break-words">
              {post.text}
            </div>
          )}

          {/* תמונה */}
          {post.image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336]">
              <img
                src={post.image}
                alt=""
                className="w-full max-h-[500px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* כפתורי פעולה */}
          <div className="flex items-center justify-between max-w-[400px] mt-3 -ml-2">
            {/* תגובה */}
            <button className="flex items-center gap-2 text-[#71767b] hover:text-[#1d9bf0] group">
              <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              {commentsCount > 0 && (
                <span className="text-[13px]">{commentsCount}</span>
              )}
            </button>

            {/* ריטווט */}
            <button
              onClick={() => setRetweeted(p => !p)}
              className={`flex items-center gap-2 group ${retweeted ? 'text-[#00ba7c]' : 'text-[#71767b] hover:text-[#00ba7c]'}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#00ba7c]/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              {retweeted && <span className="text-[13px]">1</span>}
            </button>

            {/* לייק */}
            <button
              onClick={() => onToggleLike?.(post._id)}
              className={`flex items-center gap-2 group ${liked ? 'text-[#f91880]' : 'text-[#71767b] hover:text-[#f91880]'}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#f91880]/10 transition-colors">
                <svg
                  width="18" height="18" viewBox="0 0 24 24"
                  fill={liked ? '#f91880' : 'none'}
                  stroke={liked ? '#f91880' : 'currentColor'}
                  strokeWidth="2"
                  className={liked ? 'scale-110 transition-transform' : 'transition-transform'}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              {likesCount > 0 && (
                <span className="text-[13px]">{likesCount}</span>
              )}
            </button>

            {/* שיתוף */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 group ${shared ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#1d9bf0]'}`}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
                {shared ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
