import { defineConfig, loadEnv } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

// Load environment variables from .env files
const { publicVars } = loadEnv({ prefixes: ['VITE_'] })

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

