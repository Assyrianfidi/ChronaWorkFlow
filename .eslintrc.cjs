module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  ignorePatterns: ['backend/**', 'client/**', 'frontend/**'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      files: [
        'server/**/*.ts',
        'server/**/*.tsx',
        'shared/**/*.ts',
        'shared/**/*.tsx',
        'src/runtime/**/*.ts',
        'src/runtime/**/*.tsx',
      ],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    {
      files: ['server/**/*.ts', 'server/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'no-empty': 'off',
        'no-useless-escape': 'off',
      },
    },
    {
      files: ['server/types/**/*.ts', 'server/types/**/*.tsx', 'server/types/**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-namespace': 'off',
      },
    },
    {
      files: ['server/utils/**/*.ts', 'server/utils/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'prefer-const': 'off',
      },
    },
    {
      files: ['server/services/**/*.ts', 'server/services/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'prefer-const': 'off',
      },
    },
    {
      files: ['server/routes/**/*.ts', 'server/routes/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'prefer-const': 'off',
      },
    },
    {
      files: ['server/runtime/**/*.ts', 'server/runtime/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-namespace': 'off',
        'prefer-const': 'off',
      },
    },
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 5,
      },
    ],
  },
};
