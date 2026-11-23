import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'src/components/ui'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // AGENT.md, regla 1: la UI solo accede a datos mediante `@/data` (envuelto en hooks).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data/mock', '**/data/mock/*', '**/data/supabase', '**/data/supabase/*'],
              message: 'Importa desde "@/data" (AGENT.md, regla 1). Nunca desde los adaptadores.',
            },
          ],
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'El cliente de Supabase solo vive en src/data.',
            },
          ],
        },
      ],
    },
  },
  prettier,
)
