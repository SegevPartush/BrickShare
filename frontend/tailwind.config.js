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
        accent: 'var(--accent)'
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
        hairline: '0 0 0 1px rgba(0,0,0,0.03)'
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
