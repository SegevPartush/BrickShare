import React from 'react';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 42 }: LogoProps) {
  // Image is ~3.2:1 wide, use size as height
  return (
    <img
      src="/logo.png"
      alt="BrickShare"
      style={{ height: size, width: 'auto', maxWidth: size * 3.4 }}
      className="object-contain cursor-pointer transition-opacity hover:opacity-80 select-none"
      draggable={false}
    />
  );
}
