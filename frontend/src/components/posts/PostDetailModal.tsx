import React, { useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import CommentList, { CommentItem } from './CommentList';
import CommentForm from './CommentForm';
import { Post } from '../../types';

interface Props {
  post: Post;
  authorName: string;
  timeAgoText: string;
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  shared: boolean;
  comments: CommentItem[];
  commentsLoading: boolean;
  commentsLoaded: boolean;
  currentUser?: { username?: string; email?: string; profileImage?: string; id?: string; _id?: string } | null;
  isSignedIn: boolean;
  newComment: string;
  submitting: boolean;
  onClose: () => void;
  onLike: () => void;
  onShare: () => void;
  onCommentChange: (val: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onDeleteComment: (id: string) => void;
  onLoginRedirect: () => void;
}

// Modal בסגנון פייסבוק - נפתח כשלוחצים על תמונת פוסט בפיד
// מאפשר לייק, תגובה ושיתוף מבלי לעזוב את הפיד
export default function PostDetailModal({
  post,
  authorName,
  timeAgoText,
  liked,
  likesCount,
  commentsCount,
  shared,
  comments,
  commentsLoading,
  commentsLoaded,
  currentUser,
  isSignedIn,
  newComment,
  submitting,
  onClose,
  onLike,
  onShare,
  onCommentChange,
  onSubmitComment,
  onDeleteComment,
  onLoginRedirect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const meId = currentUser?.id || currentUser?._id;

  // סגירה בלחיצה על Escape
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[980px] max-h-[90vh] bg-[#16181c] border border-[#2f3336] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="md:w-[62%] bg-black flex items-center justify-center">
          <img src={post.image} alt="LEGO build" className="w-full h-full max-h-[90vh] object-contain" />
        </div>

        <div className="md:w-[38%] flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-[#2f3336] flex items-center gap-3">
            <Avatar name={authorName} imageUrl={post.author?.profileImage} size={40} />
            <div>
              <div className="font-bold text-[15px]">{authorName}</div>
              <div className="text-[#71767b] text-[13px]">{timeAgoText}</div>
            </div>
          </div>

          <div className="p-4 border-b border-[#2f3336]">
            {post.title && <div className="font-bold text-[16px] mb-2">{post.title}</div>}
            {post.text && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.text}</p>}
          </div>

          <div className="px-4 py-2 border-b border-[#2f3336] flex items-center justify-between">
            <button
              type="button"
              onClick={onLike}
              className={`flex items-center gap-1.5 ${liked ? 'text-[#f91880]' : 'text-[#71767b] hover:text-[#f91880]'}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? '#f91880' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="text-[13px] font-medium">{likesCount}</span>
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="flex items-center gap-1.5 text-[#71767b] hover:text-[#1d9bf0]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[13px] font-medium">{commentsCount}</span>
            </button>
            <button
              type="button"
              onClick={onShare}
              className={`flex items-center gap-1.5 ${shared ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#1d9bf0]'}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span className="text-[13px] font-medium">{shared ? 'Shared' : 'Share'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <CommentList
              comments={comments}
              loading={commentsLoading}
              loaded={commentsLoaded}
              currentUserId={meId}
              onDelete={onDeleteComment}
              avatarSize={30}
            />
          </div>

          {isSignedIn ? (
            <div className="p-3 border-t border-[#2f3336]">
              <CommentForm
                ref={inputRef}
                value={newComment}
                onChange={onCommentChange}
                onSubmit={onSubmitComment}
                submitting={submitting}
                currentUser={currentUser}
                placeholder="Write a comment..."
                avatarSize={30}
              />
            </div>
          ) : (
            <div className="p-3 border-t border-[#2f3336]">
              <button onClick={onLoginRedirect} className="text-[13px] text-[#1d9bf0] hover:underline">
                Sign in to comment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
