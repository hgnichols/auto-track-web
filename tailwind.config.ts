import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"SF Pro Text"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      },
      boxShadow: {
        soft: '0 22px 45px -20px rgba(15, 23, 42, 0.25)'
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(180deg, #dbe7ff 0%, #f3f5ff 52%, #e2ebff 100%)',
        'app-gradient-dark': 'linear-gradient(180deg, #0f172a 0%, #111827 45%, #020617 100%)'
      }
    }
  },
  plugins: []
};

export default config;
