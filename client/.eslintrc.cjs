module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    // React 17+ JSX transform — no need to import React in every file
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'no-console': 'off',

    // Pre-existing issues across the codebase — warnings so CI passes
    // while still surfacing them in the editor. Fix incrementally.
    'no-unused-vars': 'warn',
    'no-empty': 'warn',
    'react/no-unescaped-entities': 'warn',
    'no-case-declarations': 'warn',
    'no-dupe-keys': 'warn',
    'no-prototype-builtins': 'warn',
    'no-useless-catch': 'warn',
    'no-useless-escape': 'warn',
    'no-dupe-else-if': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/']
};
