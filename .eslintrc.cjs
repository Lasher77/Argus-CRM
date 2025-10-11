module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  ignorePatterns: [
    'node_modules/',
    'frontend/',
    'backend/node_modules/',
    'backend/data/',
    'backend/db/**'
  ],
  rules: {
    'no-console': 'off'
  }
};
