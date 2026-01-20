/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F7F2EC',       // 배경
          paper: '#FFFFFF',    // 카드/표면
          panel: '#EADFD4',    // 사이드 패널
          ink: '#1F1A17',      // 본문 텍스트
          accent: '#C6A58A',   // 포인트(버튼/배지 등)
        },
        state: {
          success: '#16a34a',
          warning: '#eab308',
          danger:  '#dc2626',
          info:    '#4f46e5',
        },
        sand: {
          50: '#F7F2EC',
          100: '#F0E7DD',
          200: '#E6DAC8',
        },
        coffee: {
          600: '#6B4E3D',
          700: '#5A3F31',
        },
        mocha: {
          100: '#EBDDD2',
          200: '#DCC7B7',
        },
      },
      fontFamily: {
        // 시스템 기본 + 보기 좋은 대체 폰트
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      borderRadius: {
        xl2: '1rem', // 카드 둥근맛 조금 더
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};