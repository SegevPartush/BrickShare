import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-12 py-8 text-body font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-transparent text-white border border-border hover:opacity-95 shadow-soft',
  secondary: 'bg-transparent text-fg border border-border hover:bg-white/5',
  ghost: 'bg-transparent text-fg border border-transparent hover:bg-white/5',
  danger: 'bg-transparent text-fg border border-border hover:border-red-500/40 hover:bg-red-500/5',
};

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const primaryStyle = variant === 'primary'
    ? { backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderColor: 'rgba(255,255,255,0.12)' }
    : undefined;

  return (
    <button className={`${base} ${variants[variant]} ${className}`} style={primaryStyle} {...props}>
      {children}
    </button>
  );
}
