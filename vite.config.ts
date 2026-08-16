/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/**
 * iPhone WebKit / Quark can black-hole Vite internals (`/@vite/client`,
 * `/@fs/E:/…` with a Windows drive colon, and `/node_modules/.vite/deps`
 * because of the `/.vite/` dot-segment). Serve HMR stubs as `/dev-*.js`,
 * prebundles as `/dev-deps/…`, and rewrite in-root `/@fs/<drive>:…/src/x`
 * to `/src/x`.
 */
function phoneSafeVitePaths(): Plugin {
  const exact: Array<[from: string, to: string]> = [
    ['/@vite/client', '/dev-hmr.js'],
    ['/@vite/env', '/dev-hmr.js'],
    ['/@react-refresh', '/dev-refresh.js'],
    ['/__vite/client', '/dev-hmr.js'],
    ['/__vite/env', '/dev-hmr.js'],
    ['/__vite/react-refresh', '/dev-refresh.js'],
  ]
  const prefixes: Array<[from: string, to: string]> = [
    ['/node_modules/.vite/deps/', '/dev-deps/'],
    ['/@fs/', '/dev-fs/'],
    ['/@id/', '/dev-id/'],
    ['/__vite/fs/', '/dev-fs/'],
    ['/__vite/id/', '/dev-id/'],
  ]
  let rootFsPattern: RegExp | null = null

  function escapeRe(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  function stripRootFs(code: string) {
    if (!rootFsPattern) return code
    return code.replace(rootFsPattern, '')
  }

  function needsRewrite(text: string) {
    return (
      text.includes('/@') ||
      text.includes('/__vite/') ||
      text.includes('/dev-fs/') ||
      text.includes('/node_modules/.vite/')
    )
  }

  function rewriteOutgoing(code: string) {
    let next = stripRootFs(code)
    for (const [from, to] of exact) next = next.split(from).join(to)
    for (const [from, to] of prefixes) next = next.split(from).join(to)
    return next
  }

  function rewriteIncoming(url: string) {
    const q = url.indexOf('?')
    const path = q === -1 ? url : url.slice(0, q)
    const qs = q === -1 ? '' : url.slice(q)
    if (path === '/dev-hmr.js' || path === '/dev-refresh.js' || path === '/dev-ping.js') {
      return url
    }
    if (path.startsWith('/dev-deps/')) {
      return '/node_modules/.vite/deps/' + path.slice('/dev-deps/'.length) + qs
    }
    if (path.startsWith('/dev-fs/')) return '/@fs/' + path.slice('/dev-fs/'.length) + qs
    if (path.startsWith('/dev-id/')) return '/@id/' + path.slice('/dev-id/'.length) + qs
    return url
  }

  function shouldPatch(url: string) {
    const pathname = url.split('?')[0]
    if (pathname.startsWith('/node_modules/.vite/deps/')) return true
    if (pathname.startsWith('/dev-deps/')) return true
    if (pathname.startsWith('/node_modules/')) return false
    if (pathname.endsWith('.css')) return false
    if (pathname === '/dev-hmr.js' || pathname === '/dev-refresh.js' || pathname === '/dev-ping.js') {
      return false
    }
    if (/\.(woff2?|png|jpe?g|gif|webp|svg|ico|mp3|mp4|wav)$/i.test(pathname)) {
      return false
    }
    return (
      pathname === '/' ||
      pathname.startsWith('/src/') ||
      pathname.startsWith('/@') ||
      pathname.startsWith('/dev-fs/') ||
      pathname.startsWith('/dev-id/')
    )
  }

  function patchResponse(req: IncomingMessage, res: ServerResponse) {
    const originalEnd = res.end.bind(res)
    const originalWrite = res.write.bind(res)
    const chunks: Buffer[] = []
    let buffering = false

    res.write = ((chunk: unknown, encoding?: unknown, cb?: unknown) => {
      if (res.headersSent) {
        return originalWrite(chunk as never, encoding as never, cb as never)
      }
      buffering = true
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      if (typeof encoding === 'function') encoding()
      if (typeof cb === 'function') cb()
      return true
    }) as ServerResponse['write']

    res.end = ((chunk?: unknown, encoding?: unknown, cb?: unknown) => {
      if (res.headersSent) {
        return originalEnd(chunk as never, encoding as never, cb as never)
      }
      if (chunk && typeof chunk !== 'function') {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      const done = typeof encoding === 'function' ? encoding : cb
      if (!buffering && chunks.length === 0) {
        return originalEnd(chunk as never, encoding as never, cb as never)
      }
      const type = String(res.getHeader('content-type') || '')
      let body = Buffer.concat(chunks)
      if (/javascript|ecmascript|html|json/.test(type) || shouldPatch(req.url || '')) {
        const text = body.toString('utf8')
        if (needsRewrite(text)) {
          const rewritten = rewriteOutgoing(text)
          body = Buffer.from(rewritten)
          if (!res.headersSent) res.setHeader('Content-Length', body.length)
        }
      }
      return originalEnd(body, done as never)
    }) as ServerResponse['end']
  }

  return {
    name: 'phone-safe-vite-paths',
    apply: 'serve',
    configResolved(config) {
      const abs = config.root.replace(/\\/g, '/')
      const withoutDrive = abs.replace(/^[A-Za-z]:/, '')
      rootFsPattern = new RegExp('/@fs/[A-Za-z]:' + escapeRe(withoutDrive), 'g')
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url) req.url = rewriteIncoming(req.url)
        const pathname = (req.url || '').split('?')[0]
        if (pathname.endsWith('.css')) {
          const originalEnd = res.end.bind(res)
          res.end = ((chunk?: unknown, encoding?: unknown, cb?: unknown) => {
            if (typeof chunk === 'string' && needsRewrite(chunk)) {
              const rewritten = rewriteOutgoing(chunk)
              if (!res.headersSent) {
                res.setHeader('Content-Length', Buffer.byteLength(rewritten))
              }
              return originalEnd(rewritten, encoding as never, cb as never)
            }
            return originalEnd(chunk as never, encoding as never, cb as never)
          }) as ServerResponse['end']
        } else if (req.url && shouldPatch(req.url)) {
          patchResponse(req, res)
        }
        next()
      })
    },
    transformIndexHtml(html) {
      return rewriteOutgoing(html)
    },
  }
}

export default defineConfig({
  root: projectRoot,
  // Project Pages: https://ochprince.github.io/name-everything/
  // Local `vite` / `vite preview` keep root `/` unless CI=true (GitHub Actions).
  base: process.env.CI ? '/name-everything/' : '/',
  plugins: [
    react(),
    phoneSafeVitePaths(),
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
    cors: true,
    hmr: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    passWithNoTests: true,
  },
})
