/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#030712',
        deepNavy: '#050b24',
        accentBlue: '#2563eb',
        accentCyan: '#06b6d4',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
