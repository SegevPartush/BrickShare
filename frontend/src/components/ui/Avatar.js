import React from 'react';

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/g).filter(Boolean);
  if (!parts.length) return '?';
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase() || '?';
}

export default function Avatar({ name, imageUrl, size = 40 }) {
  const initials = getInitials(name);

  return (
    <div
      className="inline-flex items-center justify-center border border-[#2f3336] bg-[#16181c] text-white overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: '8px'
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold">{initials}</span>
      )}
    </div>
  );
}
