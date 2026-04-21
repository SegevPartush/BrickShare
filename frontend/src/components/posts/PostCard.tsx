import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import CommentList, { CommentItem } from './CommentList';
import CommentForm from './CommentForm';
import PostDetailModal from './PostDetailModal';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

export interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onToggleLike?: (postId: string) => void;
  matchReason?: string;
  onDeleted?: (postId: string) => void;
  onEdited?: (postId: string, newText: string) => void;
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

// בודק אם המשתמש הנוכחי כבר עשה לייק לפוסט
function isLikedByUser(post: Post, userId?: string): boolean {
  if (!userId) return false;
  return post.likes.some((u: any) => {
    const id = u?.id || u?._id || u;
    return typeof id === 'string' ? id === userId : id?.toString?.() === userId;
  });
}

export default function PostCard({ post, currentUserId, onToggleLike, matchReason, onDeleted, onEdited }: PostCardProps) {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const isSignedIn = Boolean(accessToken);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsBusy, setCommentsBusy] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(isLikedByUser(post, currentUserId));
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.commentCount ?? 0);
  const [shared, setShared] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editBusy, setEditBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const authorName = post.author?.username || post.author?.email?.split('@')[0] || 'User';
  const authorHandle = '@' + authorName.toLowerCase().replace(/\s+/g, '_');
  const authorId = post.author?._id;
  const isOwnPost = Boolean(authorId && (user?.id === authorId || user?._id === authorId));
  const meId = user?.id || user?._id;

  function goToProfile() {
    if (authorId) navigate(`/profile/${authorId}`);
  }

  // סוגר את תפריט 3-הנקודות אם לחצו מחוץ לו
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // טוען תגובות פעם אחת בלבד - כשנפתחת אזור התגובות או ה-modal
  async function ensureCommentsLoaded() {
    if (commentsLoaded) return;
    setCommentsBusy(true);
    try {
      const data = await api.getComments(post._id);
      setComments(data);
      setCommentsLoaded(true);
    } catch {
      setComments([]);
    } finally {
      setCommentsBusy(false);
    }
  }

  // טוען תגובות אוטומטית כשה-modal נפתח
  useEffect(() => {
    if (modalOpen) ensureCommentsLoaded();
  }, [modalOpen]); // eslint-disable-line

  async function handleDelete() {
    if (!accessToken) return;
    setShowMenu(false);
    if (!window.confirm('למחוק את הפוסט?')) return;
    try {
      await api.deletePost({ accessToken, postId: post._id });
      onDeleted?.(post._id);
    } catch { /* silent */ }
  }

  async function handleSaveEdit() {
    if (!accessToken || !editText.trim()) return;
    setEditBusy(true);
    try {
      await api.updatePost({ accessToken, postId: post._id, text: editText.trim() });
      onEdited?.(post._id, editText.trim());
      setEditMode(false);
    } catch { /* silent */ }
    finally { setEditBusy(false); }
  }

  // Optimistic update - משנה UI מיד ושולח לשרת ברקע
  function handleLike() {
    if (!isSignedIn) { window.location.href = '/login'; return; }
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    onToggleLike?.(post._id);
  }

  async function handleToggleComments() {
    const opening = !showComments;
    setShowComments(opening);
    if (opening) {
      await ensureCommentsLoaded();
      setTimeout(() => commentInputRef.current?.focus(), 150);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !accessToken) return;
    setSubmitting(true);
    try {
      const comment = await api.addComment({ accessToken, postId: post._id, text: newComment.trim() });
      setComments((prev) => [...prev, comment]);
      setCommentsCount((prev) => prev + 1);
      setNewComment('');
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  async function handleDeleteComment(commentId: string) {
    if (!accessToken) return;
    try {
      await api.deleteComment({ accessToken, commentId });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }

  // שיתוף - משתמש ב-Web Share API אם קיים, אחרת מעתיק ללוח
  async function handleShare() {
    const shareUrl = `${window.location.origin}/feed?post=${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${authorName} on BrickShare`, url: shareUrl });
      } else {
        await navigator.clipboard?.writeText(shareUrl);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* user cancelled */ }
  }

  return (
    <article className="border-b border-[#2f3336] hover:bg-white/[0.015] transition-colors">
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            <button onClick={goToProfile} className="block">
              <Avatar name={authorName} imageUrl={post.author?.profileImage} size={44} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span onClick={goToProfile} className="font-bold text-[15px] hover:underline cursor-pointer">{authorName}</span>
                <span className="text-[#71767b] text-[14px]">{authorHandle}</span>
                <span className="text-[#71767b]">·</span>
                <span className="text-[#71767b] text-[13px]">{timeAgo(post.createdAt)}</span>
              </div>

              {isOwnPost && (
                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#71767b] hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                    </svg>
                  </button>
                  {showMenu && (
                    <div className="absolute top-10 right-0 w-44 bg-[#16181c] border border-[#2f3336] rounded-xl shadow-2xl z-20 overflow-hidden">
                      <button
                        onClick={() => { setEditMode(true); setEditText(post.text || ''); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-white hover:bg-white/[0.06] transition-colors"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Post
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[15px] text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {matchReason && (
              <div className="text-[12px] text-[#71767b] mt-0.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {matchReason}
              </div>
            )}

            {post.title && !editMode && <div className="font-bold text-[17px] text-white mt-1.5">{post.title}</div>}

            {editMode ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  dir="auto"
                  rows={3}
                  className="w-full bg-[#202327] border border-[#1d9bf0] rounded-xl px-3 py-2 text-[15px] text-white outline-none resize-none"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={editBusy || !editText.trim()}
                    className="px-4 py-1.5 rounded-full bg-[#1d9bf0] text-white text-[13px] font-bold disabled:opacity-40 hover:bg-[#1a8cd8] transition-colors"
                  >
                    {editBusy ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-1.5 rounded-full border border-[#2f3336] text-white text-[13px] font-bold hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              post.text && (
                <p className="text-[15px] leading-[1.5] mt-1 whitespace-pre-wrap break-words text-[#e7e9ea]">{post.text}</p>
              )
            )}
          </div>
        </div>

        {post.image && (
          <div className="mt-3 ml-[56px] rounded-2xl overflow-hidden border border-[#2f3336] bg-[#0f1115] aspect-[16/9]">
            <button type="button" onClick={() => setModalOpen(true)} className="block w-full h-full text-left">
              <img src={post.image} alt="LEGO build" className="w-full h-full object-cover hover:opacity-95 transition-opacity" loading="lazy" />
            </button>
          </div>
        )}

        <div className="ml-[56px] flex items-center justify-between max-w-[380px] mt-1 -ml-1 py-1">
          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 group transition-colors ${showComments ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#1d9bf0]'}`}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            {commentsCount > 0 && <span className="text-[13px] font-medium">{commentsCount}</span>}
          </button>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 group transition-colors ${liked ? 'text-[#f91880]' : 'text-[#71767b] hover:text-[#f91880]'}`}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#f91880]/10 transition-colors">
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill={liked ? '#f91880' : 'none'}
                stroke={liked ? '#f91880' : 'currentColor'}
                strokeWidth="2"
                style={{ transition: 'transform 0.15s', transform: liked ? 'scale(1.2)' : 'scale(1)' }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            {likesCount > 0 && <span className="text-[13px] font-medium">{likesCount}</span>}
          </button>

          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 group transition-colors ${shared ? 'text-[#1d9bf0]' : 'text-[#71767b] hover:text-[#1d9bf0]'}`}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-[#1d9bf0]/10 transition-colors">
              {shared ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

      {showComments && (
        <div className="px-4 pb-3 ml-[56px] border-t border-[#2f3336]/50 mt-1 pt-3">
          <CommentList
            comments={comments}
            loading={commentsBusy}
            loaded={commentsLoaded}
            currentUserId={meId}
            onDelete={handleDeleteComment}
          />
          {isSignedIn ? (
            <CommentForm
              ref={commentInputRef}
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleSubmitComment}
              submitting={submitting}
              currentUser={user || undefined}
            />
          ) : (
            <button onClick={() => { window.location.href = '/login'; }} className="text-[13px] text-[#1d9bf0] hover:underline">
              Sign in to comment
            </button>
          )}
        </div>
      )}

      {modalOpen && post.image && (
        <PostDetailModal
          post={post}
          authorName={authorName}
          timeAgoText={timeAgo(post.createdAt)}
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          shared={shared}
          comments={comments}
          commentsLoading={commentsBusy}
          commentsLoaded={commentsLoaded}
          currentUser={user}
          isSignedIn={isSignedIn}
          newComment={newComment}
          submitting={submitting}
          onClose={() => setModalOpen(false)}
          onLike={handleLike}
          onShare={handleShare}
          onCommentChange={setNewComment}
          onSubmitComment={handleSubmitComment}
          onDeleteComment={handleDeleteComment}
          onLoginRedirect={() => { window.location.href = '/login'; }}
        />
      )}
    </article>
  );
}
