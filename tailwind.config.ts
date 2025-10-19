import type { Config } from 'tailwindcss';

const config: Config = {
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
        'app-gradient': 'linear-gradient(180deg, #f8faff 0%, #ffffff 55%, #f2f6ff 100%)'
      }
    }
  },
  plugins: []
};

export default config;
