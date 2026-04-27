import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'
import { getMFSharedConfig } from '@edforge/config/mf-shared'

// Load environment variables from .env files
const { publicVars } = loadEnv({ prefixes: ['VITE_'] })

// Get API URL from environment (used for proxy target in dev mode)
const API_URL = process.env.VITE_API_URL
if (!API_URL && process.env.NODE_ENV === 'development') {
  console.warn('[Shell] VITE_API_URL is not set — dev proxy will not work. Set it in .env.local')
}
if (!API_URL && process.env.NODE_ENV === 'production') {
  throw new Error('VITE_API_URL must be set for production builds. Check Vercel environment configuration.')
}

// Production builds use same-origin relative paths for remotes (consolidated deployment).
// Development uses localhost ports for each remote's dev server.
// Build timestamp is appended as a query param in production to bust browser cache
// across deployments — prevents stale remoteEntry.js from being served from HTTP cache.
const isProd = process.env.NODE_ENV === 'production'
const buildTimestamp = Date.now()
function remoteUrl(dirName: string, mfName: string, devPort: number): string {
  return isProd
    ? `${mfName}@/remotes/${dirName}/remoteEntry.js?t=${buildTimestamp}`
    : `${mfName}@http://localhost:${devPort}/remoteEntry.js`
}

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
    define: publicVars,
  },
  server: {
    port: 3000,
    cors: true,
    historyApiFallback: true, // Critical for SPA routing
    // Development-only proxy to bypass CORS
    // Only active in dev mode (rsbuild automatically checks NODE_ENV)
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: API_URL,
        changeOrigin: true,
        secure: true,
        // Remove /api prefix - target URL already includes /prod
        // /api/users/123 -> /users/123 (then target adds /prod)
        pathRewrite: { '^/api': '' },
        // http-proxy-middleware automatically forwards all headers
        // We don't modify them to avoid corruption during body streaming
        onProxyReq: (_proxyReq, req, _res) => {
          // Log for debugging only - don't modify headers
          if (process.env.NODE_ENV === 'development') {
            const authHeader = req.headers.authorization
            const tenantId = req.headers['x-tenant-id']
            console.log(`[Proxy] ${req.method} ${req.url} -> ${API_URL}${req.url?.replace('/api', '')}`)
            console.log(`[Proxy] Headers - Authorization: ${authHeader ? `${authHeader.substring(0, 30)}...` : 'missing'}, X-Tenant-Id: ${tenantId || 'missing'}`)
          }
        },
        onProxyRes: (proxyRes, req, _res) => {
          // Log response for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`)
          }
        },
        onError: (err, _req, _res) => {
          console.error('[Proxy Error]', err.message)
        },
      },
    } : undefined,
  },
  dev: {
    hmr: true,
  },
  html: {
    title: 'EdForge EMIS',
    favicon: './public/favicon.svg',
    template: './index.html',
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  tools: {
    rspack: (config, { appendPlugins }) => {
      // Ensure Rspack can resolve workspace packages from the monorepo root node_modules
      // (fixes pnpm symlink resolution on Vercel for packages in types/packages/*)
      const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
      config.resolve = {
        ...config.resolve,
        modules: ['node_modules', path.resolve(monorepoRoot, 'node_modules')],
        alias: {
          ...(config.resolve?.alias || {}),
        },
      }
      config.output = {
        ...config.output,
        // Shell must use '/' (not 'auto') to prevent historyApiFallback from serving
        // index.html when nested routes (e.g. /settings/account) request JS assets.
        // Remotes use 'auto' instead — their assets resolve from their own origin.
        publicPath: '/',
      }
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'shell',
          remotes: {
            academics:          remoteUrl('academics', 'academics', 3002),
            people:             remoteUrl('people', 'people', 3006),
            finance:            remoteUrl('finance', 'finance', 3003),
            analytics:          remoteUrl('analytics', 'analytics', 3008),
          },
          shared: getMFSharedConfig('host'),
        }),
      ])
    },
  },
})

