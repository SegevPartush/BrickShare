import React from 'react';
import Avatar from '../ui/Avatar';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onToggleLike?: (postId: string) => void;
  matchReason?: string;
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isLiked(post: Post, userId?: string): boolean {
  if (!userId) return false;
  return post.likes.some((u: any) => {
    const id = u?.id || u?._id || u;
    return typeof id === 'string' ? id === userId : id?.toString?.() === userId;
  });
}

export default function PostCard({ post, currentUserId, onToggleLike, matchReason }: PostCardProps) {
  const liked = isLiked(post, currentUserId);
  const authorName = post.author?.username || post.author?.email || 'User';

  return (
    <article className="post rounded-lg border border-border bg-bg p-16 transition hover:bg-white/2">
      <div className="flex items-start gap-12">
        <Avatar name={authorName} imageUrl={post.author?.profileImage} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-body font-semibold truncate">{authorName}</div>
          <div className="text-caption text-muted mt-4">
            @{authorName.replace(/\s+/g, '')} · {formatRelative(post.createdAt)}
          </div>
          {matchReason && (
            <div className="mt-10 text-caption text-muted">
              Match: <span className="text-fg/90">{matchReason}</span>
            </div>
          )}

          {post.text && <div className="text-body mt-12 whitespace-pre-wrap leading-7">{post.text}</div>}

          {post.image && (
            <div className="mt-12 overflow-hidden rounded-lg border border-border">
              <img src={post.image} className="w-full max-h-[380px] object-cover" alt="" />
            </div>
          )}

          <div className="mt-14 flex items-center justify-between gap-12">
            <button type="button" className="inline-flex items-center gap-8 text-caption text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
              </svg>
              <span>{post.commentCount || 0}</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-8 text-caption transition ${liked ? 'liked' : ''}`}
              onClick={() => onToggleLike?.(post._id)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className={liked ? 'text-fg' : 'text-muted'}>{post.likes.length}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
