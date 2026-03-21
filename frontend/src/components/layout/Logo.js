import React from 'react';

export default function Logo({ size = 42 }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-lg relative overflow-hidden cursor-pointer transition-all hover:scale-105 hover:rotate-[-5deg]"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 24 24" fill="white" className="relative z-10">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="13" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="13" width="7" height="7" rx="1"/>
          <rect x="13" y="13" width="7" height="7" rx="1"/>
        </svg>
      </div>
      <div>
        <div
          className="font-bold leading-none"
          style={{
            fontSize: size * 0.52,
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #1d9bf0 0%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          BrickShare
        </div>
        <div
          className="text-[#71767b] leading-tight mt-[-2px]"
          style={{ fontSize: size * 0.21 }}
        >
          Share Your Passion, Brick by Brick
        </div>
      </div>
    </div>
  );
}
