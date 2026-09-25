/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // COAD-X Light Enterprise Master Palette
        navy: {
          950: '#071322',
          900: '#0F2747', // Primary Navy
          800: '#173B63', // Secondary Navy
          700: '#1E4976',
          text: '#0F172A',
          body: '#475569',
          muted: '#64748B',
        },
        brand: {
          blue: '#0F8FB3', // Primary Blue
          'blue-hover': '#0D7A99',
          light: '#E6F6FA', // Light Blue Accent
          border: '#E2E8F0', // Border Gray
          bg: '#F8FAFC', // Body Background
          card: '#FFFFFF', // Card White
        },
        // Legacy aliases mapped to clean light tokens for 100% stability
        darker: '#F8FAFC',
        dark: '#FFFFFF',
        card: '#FFFFFF',
        'card-hover': '#F8FAFC',
        element: '#F1F5F9',
      }
    },
  },
  plugins: [],
}
