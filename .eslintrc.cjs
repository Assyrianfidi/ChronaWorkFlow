module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  ignorePatterns: ['backend/**', 'frontend/**'],
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
  plugins: ['@typescript-eslint', 'import', 'react-hooks'],
  overrides: [
    {
      files: [
        'server/app.ts',
        'server/middleware/**/*.ts',
        'server/middleware/**/*.tsx',
        'server/services/**/*.ts',
        'server/services/**/*.tsx',
        'server/types/**/*.ts',
        'server/types/**/*.tsx',
        'shared/**/*.ts',
        'shared/**/*.tsx',
        'src/runtime/**/*.ts',
        'src/runtime/**/*.tsx',
      ],
      parserOptions: {
        project: ['./tsconfig.typecheck.json'],
      },
    },
    {
      files: ['client/src/**/*.ts', 'client/src/**/*.tsx', 'client/src/**/*.js', 'client/src/**/*.jsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        'no-case-declarations': 'off',
        'no-useless-escape': 'off',
        'no-control-regex': 'off',
        'no-prototype-builtins': 'off',
        'prefer-const': 'off',
        'react-hooks/exhaustive-deps': 'off',
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
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './client/src',
            from: ['./server', './backend', './infrastructure', './prisma', './drizzle', './scripts', './server/src'],
            message:
              'client (UI) must not import server or infrastructure. Use shared types or API contracts instead.',
          },
          {
            target: './shared',
            from: ['./client', './server', './backend', './infrastructure'],
            message:
              'shared must not import client or server. shared is a leaf dependency for DTOs/types/utils only.',
          },
          {
            target: './server',
            from: ['./client', './frontend'],
            message:
              'server must not import client/frontend code. Keep server independent of UI layer.',
          },
        ],
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../server/*', '../../server/*', '../../../server/*', '../../../../server/*'],
            message: 'Do not import server from client via deep relative paths.',
          },
          {
            group: ['../server/src/*', '../../server/src/*', '../../../server/src/*', '../../../../server/src/*'],
            message: 'Do not import server/src from client via deep relative paths.',
          },
          {
            group: ['../backend/*', '../../backend/*', '../../../backend/*', '../../../../backend/*'],
            message: 'Do not import backend from client via deep relative paths.',
          },
        ],
      },
    ],
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
