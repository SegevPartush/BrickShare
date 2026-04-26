module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        fg: 'var(--fg)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        tertiary: 'var(--text-tertiary)'
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px'
      },
      borderRadius: {
        md: '10px',
        lg: '12px'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.06)',
        hairline: '0 0 0 1px rgba(0,0,0,0.03)',
        card: '0 4px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
      },
      fontSize: {
        title: ['28px', { lineHeight: '36px', fontWeight: '650' }],
        subtitle: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }]
      }
    }
  }
};
