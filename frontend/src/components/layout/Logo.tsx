import React from 'react';

interface LogoProps {
  size?: number;
  /** If true, stretches to fill the container width */
  fullWidth?: boolean;
}

export default function Logo({ size = 42, fullWidth = false }: LogoProps) {
  if (fullWidth) {
    return (
      <img
        src="/logo.png"
        alt="BrickShare"
        className="w-full h-auto object-contain cursor-pointer transition-opacity hover:opacity-80 select-none"
        draggable={false}
      />
    );
  }

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
