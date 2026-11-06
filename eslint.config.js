import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Script Apps Script: file senza moduli, le funzioni sono globali condivise tra i file
    files: ['apps-script/Logica.js', 'apps-script/Codice.js'],
    languageOptions: { sourceType: 'script' },
    rules: { 'no-undef': 'off', 'no-unused-vars': 'off' },
  },
])
