import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

// Load environment variables from .env files
const { publicVars } = loadEnv({ prefixes: ['VITE_'] })

// Get API URL from environment (used for proxy target)
const API_URL = process.env.VITE_API_URL || 'https://f3xlvrqt24.execute-api.us-east-1.amazonaws.com/prod'

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
      config.output = {
        ...config.output,
        publicPath: 'auto',
      }
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'shell',
          remotes: {
            academics: 'academics@http://localhost:3002/remoteEntry.js',
            finance: 'finance@http://localhost:3003/remoteEntry.js',
            edfi: 'edfi@http://localhost:3001/remoteEntry.js',
            'special-programs': 'special_programs@http://localhost:3005/remoteEntry.js',
            people: 'people@http://localhost:3006/remoteEntry.js',
            messages: 'messages@http://localhost:3007/remoteEntry.js',
            analytics: 'analytics@http://localhost:3008/remoteEntry.js',
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

