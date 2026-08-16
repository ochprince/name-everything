/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Project Pages: https://ochprince.github.io/name-everything/
  // Local `vite` / `vite preview` keep root `/` unless CI=true (GitHub Actions).
  base: process.env.CI ? '/name-everything/' : '/',
  plugins: [
    react(),
    {
      name: 'spa-github-pages-fallback',
      apply: 'build',
      closeBundle() {
        const dist = path.join(projectRoot, 'dist')
        const indexHtml = path.join(dist, 'index.html')
        const notFound = path.join(dist, '404.html')
        if (fs.existsSync(indexHtml)) fs.copyFileSync(indexHtml, notFound)
      },
    },
  ],
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    passWithNoTests: true,
  },
})
