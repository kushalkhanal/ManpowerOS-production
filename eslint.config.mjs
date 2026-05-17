/**
 * Minimal flat ESLint config.
 *
 * Goal: silence the "no eslint config" failure that lint-staged was
 * printing on every commit, without forcing a noisy fix-up pass on the
 * existing codebase. Rules are intentionally empty for now — Phase 0
 * is foundations only. Real lint rules (react, react-hooks, import
 * cycles) come in a later pass.
 */
export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node + browser globals so undefined-var checks don't fire
        // when we eventually enable them.
        process: 'readonly',
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {},
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/uploads/**',
      '**/logs/**',
      '**/.next/**',
      'client/public/**',
    ],
  },
];
