import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import obsidian from 'eslint-plugin-obsidianmd';
import globals from 'globals';

export default defineConfig([
  {
    files: ['src/**/*.ts'],
    ignores: ['main.js', 'node_modules'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      obsidianmd: obsidian,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...obsidian.configs.recommended.rules,
      'no-unused-vars': 'warn',
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.ts'],
  })),
]);
