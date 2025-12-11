/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        jdgeneaPastel: {
          primary: '#6AA0F8',
          secondary: '#9ADBC1',
          accent: '#F7D382',
          neutral: '#3D3A3A',
          'base-100': '#FAF9F7',
          info: '#93C5FD',
          success: '#86EFAC',
          warning: '#FCD34D',
          error: '#FCA5A5',
        },
      },
    ],
  },
}
