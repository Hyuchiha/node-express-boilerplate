// eslint.config.js
import airbnbExtended from 'eslint-config-airbnb-extended';
import jest from 'eslint-plugin-jest';
import security from 'eslint-plugin-security';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base config from airbnb-extended (includes import-x, n, etc.)
  ...airbnbExtended,

  // Jest plugin + recommended rules
  jest.configs['flat/recommended'],

  // Security plugin
  security.configs.recommended,

  // Prettier last, to disable formatting rules
  prettierConfig,

  // Your custom overrides / additions
  {
    plugins: {
      prettier,
    },

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        node: true,
        jest: true,
      },
    },

    rules: {
      // Your custom rules
      'no-console': 'error',
      'func-names': 'off',
      'no-underscore-dangle': 'off',
      'consistent-return': 'off',
      'jest/expect-expect': 'off',
      'security/detect-object-injection': 'off',

      // Optional: turn off some noisy rules from airbnb-extended if needed
      // 'import/prefer-default-export': 'off',
      // etc.
    },
  },

  // Optional: tell ESLint to ignore certain patterns (like old .eslintignore)
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // add others as needed
    ],
  },
];
