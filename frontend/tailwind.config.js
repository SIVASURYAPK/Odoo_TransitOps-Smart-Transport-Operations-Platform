/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rail: {
          bg: '#0B0F14',
          panel: '#111826',
          border: '#1F2937',
          muted: '#64748B',
        },
        status: {
          available: '#16A34A',
          ontrip: '#2563EB',
          shop: '#D97706',
          retired: '#DC2626',
          offduty: '#64748B',
          draft: '#8B5CF6',
          cancelled: '#DC2626',
          completed: '#16A34A',
          open: '#D97706',
          closed: '#16A34A',
        },
        accent: {
          DEFAULT: '#14B8A6',
          dim: '#0F766E',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
