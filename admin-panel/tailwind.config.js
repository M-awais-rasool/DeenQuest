/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Canvas & surfaces ──
        ink: {
          950: '#060D0F', // page background
          900: '#08110F', // readonly field
          850: '#091113', // sidebar base
          800: '#0B1517', // phone body
          700: '#0C181B', // field / inner panel
          600: '#16272B', // preview tile
          500: '#1E3238', // field border
          400: '#24393E', // muted / dashed border
          300: '#1B3036', // scrollbar, bar track
        },
        // ── Brand teal ──
        teal: {
          ink: '#06302B', // text on teal
          tint: '#123B34', // icon tile bg
          edge: '#1F5148', // icon tile border
          deep: '#178F7E',
          shadow: '#1B9484', // 3D button underside
          dark: '#1FB0A0',
          DEFAULT: '#2CC9B5',
          light: '#5EE0CE',
        },
        // ── Gold ──
        gold: {
          tint: '#2A2212',
          edge: '#4A3E28',
          tile: '#3A2F16',
          dark: '#C98F35',
          DEFAULT: '#EFB65A',
        },
        // ── Rose (danger / hard) ──
        rose: {
          tile: '#2A1218',
          DEFAULT: '#F0838C',
        },
        // ── Accents used by stat cards & charts ──
        sky: { dark: '#3F5FC0', DEFAULT: '#6E96F0' },
        violet: { dark: '#7857D6', DEFAULT: '#A78BFA' },
        // ── Text ramp ──
        fg: {
          DEFAULT: '#EDF5F4',
          dim: '#8DA5A3',
          dimmer: '#5F7E7C',
          faint: '#4E6A68',
          faintest: '#3A5250',
        },
        // easy-badge background
        leaf: '#0F2A26',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      },
      borderRadius: {
        field: '11px',
        step: '14px',
        card: '16px',
        phone: '28px',
      },
      boxShadow: {
        // chunky "pressable" underside used on primary buttons
        pop: '0 4px 0 #1B9484',
        'pop-sm': '0 3px 0 #1B9484',
        phone: '0 20px 50px rgba(0,0,0,.5)',
      },
    },
  },
  plugins: [],
}
