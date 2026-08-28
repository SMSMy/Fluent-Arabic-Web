/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['popup/popup.html', 'popup/popup.js'],
  theme: {
    extend: {
      colors: {
        brand: '#0F6E56',
        'inverse-primary': '#525e7f',
        'primary-container': '#2e3a59',
        surface: '#101415',
        error: '#ffb4ab',
        'on-tertiary': '#1000a9',
        secondary: '#4edea3',
        'on-secondary': '#003824',
        'surface-bright': '#363a3b',
        'on-surface-variant': '#c6c6ce',
        'on-secondary-container': '#00311f',
        'surface-container-highest': '#323537',
        'on-tertiary-fixed-variant': '#2f2ebe',
        'on-tertiary-fixed': '#07006c',
        'error-container': '#93000a',
        tertiary: '#c0c1ff',
        'inverse-surface': '#e0e3e5',
        'inverse-on-surface': '#2d3133',
        'on-primary-container': '#98a4c9',
        'deep-indigo': '#1E293B',
        background: '#101415',
        'surface-tint': '#bac6ec',
        'on-primary-fixed-variant': '#3a4666',
        'on-primary': '#23304e',
        'secondary-fixed-dim': '#4edea3',
        'on-tertiary-container': '#999cff',
        'tertiary-fixed': '#e1e0ff',
        'warning-amber': '#F59E0B',
        'on-error-container': '#ffdad6',
        'on-secondary-fixed': '#002113',
        'tertiary-fixed-dim': '#c0c1ff',
        'on-secondary-fixed-variant': '#005236',
        'surface-dim': '#101415',
        'on-background': '#e0e3e5',
        'on-error': '#690005',
        'surface-container-high': '#272a2c',
        'surface-variant': '#323537',
        'surface-container': '#1d2022',
        'secondary-fixed': '#6ffbbe',
        'surface-container-low': '#191c1e',
        'primary-fixed': '#dae2ff',
        primary: '#bac6ec',
        'on-primary-fixed': '#0d1a38',
        'surface-container-lowest': '#0b0f10',
        'vibrant-emerald': '#10B981',
        'soft-gray': '#94A3B8',
        'secondary-container': '#00a572',
        outline: '#8f9098',
        'tertiary-container': '#201bb3',
        'primary-fixed-dim': '#bac6ec',
        'on-surface': '#e0e3e5',
        'outline-variant': '#45464e',
        'danger-rose': '#F43F5E'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      spacing: {
        'item-gap': '12px',
        'section-gap': '20px',
        'edge-margin': '16px',
        'container-width': '380px',
        'touch-target': '44px'
      },
      fontFamily: {
        'headline-md': ['"Segoe UI"', 'Tahoma', '"Noto Kufi Arabic"', 'sans-serif'],
        'label-md': ['"Segoe UI"', 'Tahoma', '"Noto Kufi Arabic"', 'sans-serif'],
        'body-md': ['"Segoe UI"', 'Tahoma', '"Noto Kufi Arabic"', 'sans-serif'],
        'technical-data': ['"JetBrains Mono"', 'Consolas', 'monospace'],
        'headline-lg': ['"Segoe UI"', 'Tahoma', '"Noto Kufi Arabic"', 'sans-serif'],
        'body-sm': ['"Segoe UI"', 'Tahoma', '"Noto Kufi Arabic"', 'sans-serif']
      },
      fontSize: {
        'headline-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'label-md': ['13px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'technical-data': ['11px', { lineHeight: '14px', fontWeight: '400' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }]
      }
    }
  },
  plugins: []
};
