/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['popup/popup.html', 'popup/popup.js'],
  theme: {
    extend: {
      /* الألوان كلها تشير إلى متغيرات CSS (--c-*) — يتبدلان مع :root/.dark
         في input.css — نفس الكلاسات تعمل للوضعين بدون dark: variants */
      colors: {
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
        'inverse-primary': 'rgb(var(--c-inverse-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--c-primary-container) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        error: 'rgb(var(--c-error) / <alpha-value>)',
        'on-tertiary': 'rgb(var(--c-on-tertiary) / <alpha-value>)',
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        'on-secondary': 'rgb(var(--c-on-secondary) / <alpha-value>)',
        'surface-bright': 'rgb(var(--c-surface-bright) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--c-on-surface-variant) / <alpha-value>)',
        'on-secondary-container': 'rgb(var(--c-on-secondary-container) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--c-surface-container-highest) / <alpha-value>)',
        'on-tertiary-fixed-variant': 'rgb(var(--c-on-tertiary-fixed-variant) / <alpha-value>)',
        'on-tertiary-fixed': 'rgb(var(--c-on-tertiary-fixed) / <alpha-value>)',
        'error-container': 'rgb(var(--c-error-container) / <alpha-value>)',
        tertiary: 'rgb(var(--c-tertiary) / <alpha-value>)',
        'inverse-surface': 'rgb(var(--c-inverse-surface) / <alpha-value>)',
        'inverse-on-surface': 'rgb(var(--c-inverse-on-surface) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--c-on-primary-container) / <alpha-value>)',
        'deep-indigo': 'rgb(var(--c-deep-indigo) / <alpha-value>)',
        background: 'rgb(var(--c-background) / <alpha-value>)',
        'surface-tint': 'rgb(var(--c-surface-tint) / <alpha-value>)',
        'on-primary-fixed-variant': 'rgb(var(--c-on-primary-fixed-variant) / <alpha-value>)',
        'on-primary': 'rgb(var(--c-on-primary) / <alpha-value>)',
        'secondary-fixed-dim': 'rgb(var(--c-secondary-fixed-dim) / <alpha-value>)',
        'on-tertiary-container': 'rgb(var(--c-on-tertiary-container) / <alpha-value>)',
        'tertiary-fixed': 'rgb(var(--c-tertiary-fixed) / <alpha-value>)',
        'warning-amber': 'rgb(var(--c-warning-amber) / <alpha-value>)',
        'on-error-container': 'rgb(var(--c-on-error-container) / <alpha-value>)',
        'on-secondary-fixed': 'rgb(var(--c-on-secondary-fixed) / <alpha-value>)',
        'tertiary-fixed-dim': 'rgb(var(--c-tertiary-fixed-dim) / <alpha-value>)',
        'on-secondary-fixed-variant': 'rgb(var(--c-on-secondary-fixed-variant) / <alpha-value>)',
        'surface-dim': 'rgb(var(--c-surface-dim) / <alpha-value>)',
        'on-background': 'rgb(var(--c-on-background) / <alpha-value>)',
        'on-error': 'rgb(var(--c-on-error) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--c-surface-container-high) / <alpha-value>)',
        'surface-variant': 'rgb(var(--c-surface-variant) / <alpha-value>)',
        'surface-container': 'rgb(var(--c-surface-container) / <alpha-value>)',
        'secondary-fixed': 'rgb(var(--c-secondary-fixed) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--c-surface-container-low) / <alpha-value>)',
        'primary-fixed': 'rgb(var(--c-primary-fixed) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'on-primary-fixed': 'rgb(var(--c-on-primary-fixed) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--c-surface-container-lowest) / <alpha-value>)',
        'vibrant-emerald': 'rgb(var(--c-vibrant-emerald) / <alpha-value>)',
        'soft-gray': 'rgb(var(--c-soft-gray) / <alpha-value>)',
        'secondary-container': 'rgb(var(--c-secondary-container) / <alpha-value>)',
        outline: 'rgb(var(--c-outline) / <alpha-value>)',
        'tertiary-container': 'rgb(var(--c-tertiary-container) / <alpha-value>)',
        'primary-fixed-dim': 'rgb(var(--c-primary-fixed-dim) / <alpha-value>)',
        'on-surface': 'rgb(var(--c-on-surface) / <alpha-value>)',
        'outline-variant': 'rgb(var(--c-outline-variant) / <alpha-value>)',
        'danger-rose': 'rgb(var(--c-danger-rose) / <alpha-value>)'
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
