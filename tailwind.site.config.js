/**
 * tailwind.site.config.js — إعداد Tailwind لموقع المشروع (docs/)
 *
 * التصميم مصدَّر من Stitch وكان يعتمد cdn.tailwindcss.com، وهنا نترجمه إلى CSS
 * ثابت عند البناء (مثل popup) فلا يوجد اعتماد على شبكة في وقت العرض:
 *   npm run build:site
 */
module.exports = {
  content: [
    './docs/index.html',
    './docs/privacy.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-solid': '#0c1512',
        'surface-dim': '#07100d',
        'surface-code': '#050a08',
        'surface-container': '#111d19',
        'surface-container-high': '#182823',
        'surface-container-highest': '#22352f',
        'surface-glass': 'rgba(12, 21, 18, 0.88)',
        primary: '#4edea3',
        'primary-container': '#10b981',
        secondary: '#45dfa4',
        tertiary: '#7bd8b1',
        'accent-mint': '#6ee7b7',
        'text-primary': '#f0f7f4',
        'text-secondary': '#c6dad2',
        'text-muted': '#829990',
        'border-subtle': 'rgba(78, 222, 163, 0.12)',
        'border-strong': 'rgba(78, 222, 163, 0.28)',
        'danger-surface': 'rgba(248, 113, 113, 0.12)',
        'danger-text': '#fca5a5',
        'danger-border': 'rgba(248, 113, 113, 0.3)',
        'success-surface': 'rgba(52, 211, 153, 0.12)',
        'on-primary': '#002b1b',
        'surface-variant': '#22352f',
        'error': '#ffb4ab',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
      },
      // مقاسات الطباعة كما في DESIGN.md المصمَّم
      fontSize: {
        'headline-hero': ['3.15rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '800' }],
        'headline-lg': ['2.05rem', { lineHeight: '1.35', fontWeight: '800' }],
        'headline-md': ['1.35rem', { lineHeight: '1.4', fontWeight: '700' }],
        'headline-sm': ['1.1rem', { lineHeight: '1.45', fontWeight: '700' }],
        'body-lead': ['1.12rem', { lineHeight: '1.75' }],
        'body-md': ['1.0625rem', { lineHeight: '1.85' }],
        'body-sm': ['0.95rem', { lineHeight: '1.7' }],
        caption: ['0.82rem', { lineHeight: '1.5', fontWeight: '500' }],
        'code-block': ['0.875rem', { lineHeight: '1.65' }],
        'code-inline': ['0.85em', { lineHeight: 'inherit', fontWeight: '500' }],
        'label-mono': ['0.82rem', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '600' }],
      },
      fontFamily: {
        sans: ['Tajawal', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        thmanyah: ['Tajawal', 'sans-serif'],
        heritage: ['Amiri', 'serif'],
        naskh: ['Noto Naskh Arabic', 'serif'],
        cairo: ['Cairo', 'sans-serif'],
      },
    },
  },
  // أصناف تُبدَّل من السكربت في الصفحة
  safelist: [
    'hidden',
    'bg-primary', 'text-on-primary',
    'bg-red-500', 'text-white',
    'bg-surface-code', 'text-text-muted',
    'border', 'border-border-subtle',
    'hover:text-white', 'transition-colors', 'transition-all',
    'px-2.5', 'py-1', 'rounded', 'font-bold',
  ],
  plugins: [],
};
