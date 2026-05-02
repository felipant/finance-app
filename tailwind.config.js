/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#0f172a',
        'navy-blue': '#1e293b',
        'light-blue': '#3b82f6',
         border: 'hsl(var(--border))',
      }
    },
  },
  plugins: [],
}
