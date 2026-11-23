/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Las pruebas siempre usan el adaptador mock, aunque .env.local apunte a Supabase.
    env: { VITE_DATA_MODE: 'mock', VITE_DEMO_MODE: 'true' },
  },
})
