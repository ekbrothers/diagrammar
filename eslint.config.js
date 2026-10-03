import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'openspec/**', '.claude/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
