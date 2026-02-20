import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

// Load environment variables from .env files
const { publicVars } = loadEnv({ prefixes: ['VITE_'] })

// Get API URL from environment (used for proxy target)
const API_URL = process.env.VITE_API_URL || 'https://udmx0atz53.execute-api.us-east-2.amazonaws.com/prod'

// Production builds use same-origin relative paths for remotes (consolidated deployment).
// Development uses localhost ports for each remote's dev server.
const isProd = process.env.NODE_ENV === 'production'
function remoteUrl(dirName: string, mfName: string, devPort: number): string {
  return isProd
    ? `${mfName}@/remotes/${dirName}/remoteEntry.js`
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
            finance:            remoteUrl('finance', 'finance', 3003),
            people:             remoteUrl('people', 'people', 3006),
            // [MVP-PARKED] Modules parked for post-MVP release
            // edfi:               remoteUrl('edfi', 'edfi', 3001),
            // 'special-programs': remoteUrl('special-programs', 'special_programs', 3005),
            // messages:           remoteUrl('messages', 'messages', 3007),
            // analytics:          remoteUrl('analytics', 'analytics', 3008),
            // [/MVP-PARKED]
          },
          shared: {
            // Auth - CRITICAL: aws-amplify must be singleton to share token state across all modules
            'aws-amplify': { singleton: true, eager: true },
            // Core React
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            // Routing & State
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
            '@tanstack/react-router': { singleton: true, requiredVersion: '^1.82.0', eager: true },
            zustand: { singleton: true, requiredVersion: '^5.0.0', eager: true },
            // EdForge packages
            '@edforge/ui': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/abac': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/auth': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/types': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/theme': { singleton: true, requiredVersion: '0.0.1', eager: true },
            // Forms - explicit versions to prevent MF warnings
            'react-hook-form': { singleton: true, requiredVersion: '^7.50.0', eager: true },
            '@hookform/resolvers': { singleton: true, requiredVersion: '^3.9.0', eager: true },
            zod: { singleton: true, requiredVersion: '^3.23.0', eager: true },
            // Animation - aligned version across all apps
            'framer-motion': { singleton: true, requiredVersion: '^11.15.0', eager: true },
            '@react-spring/web': { singleton: true, requiredVersion: '^10.0.3', eager: true },
          },
        }),
      ])
    },
  },
})

