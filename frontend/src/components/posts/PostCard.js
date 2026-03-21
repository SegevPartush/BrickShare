import React from 'react';
import Avatar from '../ui/Avatar';

function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function isUserLiked({ post, currentUserId }) {
  if (!currentUserId) return false;
  return Boolean(
    post?.likes?.some((u) => {
      const id = u?.id || u?._id || u;
      if (!id) return false;
      return typeof id === 'string' ? id === currentUserId : id?.toString?.() === currentUserId;
    })
  );
}

function Icon({
  children,
  className = ''
}) {
  return <span className={`inline-flex items-center justify-center ${className}`}>{children}</span>;
}

export default function PostCard({ post, currentUserId, onToggleLike, matchReason }) {
  const liked = isUserLiked({ post, currentUserId });
  const likeCount = post?.likes?.length || 0;
  const commentCount = typeof post?.commentCount === 'number' ? post.commentCount : 0;
  const authorName = post?.author?.username || post?.author?.email || 'User';
  const handle = authorName ? `@${authorName.replace(/\s+/g, '')}` : '@user';

  return (
    <article className="post rounded-lg border border-border bg-bg p-16 transition hover:bg-white/2">
      <div className="flex items-start gap-12">
        <Avatar name={authorName} imageUrl={post?.author?.profileImage} size={44} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-12">
            <div className="min-w-0">
              <div className="text-body font-semibold truncate">{authorName}</div>
              <div className="text-caption text-muted mt-4">
                {handle} · {formatRelative(post?.createdAt)}
              </div>

              {matchReason ? (
                <div className="mt-10 text-caption text-muted">
                  Match: <span className="text-fg/90">{matchReason}</span>
                </div>
              ) : null}
            </div>
          </div>

          {post?.text ? <div className="text-body mt-12 whitespace-pre-wrap leading-7">{post.text}</div> : null}

          {post?.image ? (
            <div className="mt-12 overflow-hidden rounded-lg border border-border">
              <img src={post.image} className="w-full max-h-[380px] object-cover" alt="" />
            </div>
          ) : null}

          <div className="mt-14 post-actions flex items-center justify-between gap-12">
            <div className="flex items-center gap-10">
              <button
                type="button"
                className="action-button inline-flex items-center gap-8 text-caption text-muted"
              >
                <Icon className={commentCount ? 'text-accent' : ''}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                  </svg>
                </Icon>
                <span>{commentCount}</span>
              </button>

              <button
                type="button"
                className="action-button inline-flex items-center gap-8 text-caption text-muted"
                onClick={() => {}}
              >
                <Icon>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17h10l-5 5-5-5z" />
                    <path d="M17 7H7l5-5 5 5z" />
                  </svg>
                </Icon>
                <span>{post?.retweets || 0}</span>
              </button>
            </div>

            <div className="flex items-center gap-10">
              <button
                type="button"
                className={`action-button inline-flex items-center gap-8 text-caption transition ${liked ? 'liked' : ''}`}
                onClick={() => onToggleLike?.(post._id)}
              >
                <Icon className="text-caption text-muted">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </Icon>
                <span className={liked ? 'text-fg' : 'text-muted'}>{likeCount}</span>
              </button>

              <button
                type="button"
                className="action-button inline-flex items-center justify-center rounded-lg p-8 text-caption text-muted"
                onClick={() => {}}
                aria-label="Bookmark"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

