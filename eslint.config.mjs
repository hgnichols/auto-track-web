import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'import/no-anonymous-default-export': 'off'
    }
  }
];

export default config;
