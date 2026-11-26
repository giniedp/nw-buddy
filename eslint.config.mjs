// @ts-check
// ESLint for the Angular app (apps/web), the angular-eslint project setup: TypeScript with type information and the
// component templates (inline and .html). Run with `pnpm lint`.
//
// While the app moves to modern Angular (inject, standalone, signals, control flow) the recommended rules report as
// warnings; the rules that point at bugs are errors.
import eslint from '@eslint/js'
import angular from 'angular-eslint'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

/**
 * The configs with their errors as warnings
 *
 * @param {any[]} configs
 */
function asWarnings(configs) {
  return configs.map((config) => {
    if (!config.rules) {
      return config
    }
    const rules = Object.fromEntries(
      Object.entries(config.rules).map(([name, value]) => {
        const [level, ...options] = Array.isArray(value) ? value : [value]
        const error = level === 'error' || level === 2
        return [name, error ? ['warn', ...options] : value]
      }),
    )
    return { ...config, rules }
  })
}

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  {
    files: ['apps/web/app/**/*.ts'],
    extends: asWarnings([
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ]),
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@angular-eslint/component-selector': ['warn', { type: 'element', prefix: 'nwb', style: 'kebab-case' }],
      '@angular-eslint/directive-selector': ['warn', { type: 'attribute', prefix: 'nwb', style: 'camelCase' }],
      // bugs
      '@angular-eslint/no-uncalled-signals': 'error',
      '@angular-eslint/contextual-lifecycle': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-class-members': 'error',
      'no-duplicate-case': 'error',
      'no-self-assign': 'error',
      'no-self-compare': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-cond-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-unsafe-optional-chaining': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      // don't care
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // 381
      '@typescript-eslint/no-explicit-any': 'off', // 494
      '@typescript-eslint/no-inferrable-types': 'off', // 41
      '@typescript-eslint/consistent-type-definitions': 'off', // 14
    },
  },
  {
    files: ['apps/web/app/**/*.html'],
    extends: asWarnings([
      ...angular.configs.templateRecommended,
      //...angular.configs.templateAccessibility
    ]),
    rules: {
      // bugs
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/eqeqeq': ['warn', { allowNullOrUndefined: true }],
    },
  },
)
