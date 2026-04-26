import React, { forwardRef } from 'react';
import Avatar from '../ui/Avatar';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  currentUser?: { username?: string; email?: string; profileImage?: string } | null;
  placeholder?: string;
  avatarSize?: number;
}

// טופס הוספת תגובה - משומש גם מתחת לפוסט בפיד וגם ב-modal של הפוסט
const CommentForm = forwardRef<HTMLInputElement, Props>(function CommentForm(
  { value, onChange, onSubmit, submitting, currentUser, placeholder = 'Add a comment...', avatarSize = 32 },
  ref
) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2.5 items-center">
      <Avatar name={currentUser?.username || currentUser?.email || ''} imageUrl={currentUser?.profileImage} size={avatarSize} />
      <div className="flex-1 flex items-center bg-[#1c1f24] rounded-full px-4 py-2 gap-2 border border-white/[0.06] shadow-sm focus-within:border-[#1d9bf0]/70 focus-within:ring-1 focus-within:ring-[#1d9bf0]/25 transition-all">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="auto"
          className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-tertiary"
        />
        {value.trim() && (
          <button
            type="submit"
            disabled={submitting}
            className="text-[#1d9bf0] font-bold text-[14px] disabled:opacity-40 hover:text-[#38bdf8] active:opacity-80 transition-all shrink-0"
          >
            {submitting ? '...' : 'Post'}
          </button>
        )}
      </div>
    </form>
  );
});

export default CommentForm;
