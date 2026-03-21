import React from 'react';

interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: number;
}

function getInitials(name?: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase() || '?';
}

export default function Avatar({ name, imageUrl, size = 40 }: AvatarProps) {
  return (
    <div
      className="inline-flex items-center justify-center border border-[#2f3336] bg-[#16181c] text-white overflow-hidden"
      style={{ width: size, height: size, borderRadius: '8px' }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold">{getInitials(name)}</span>
      )}
    </div>
  );
}
