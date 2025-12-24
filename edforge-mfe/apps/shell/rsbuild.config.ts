import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
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
            edfi: 'edfi@http://localhost:3004/remoteEntry.js',
            'special-programs': 'special_programs@http://localhost:3005/remoteEntry.js',
            people: 'people@http://localhost:3006/remoteEntry.js',
            messages: 'messages@http://localhost:3007/remoteEntry.js',
            analytics: 'analytics@http://localhost:3008/remoteEntry.js',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
            '@tanstack/react-router': { singleton: true, requiredVersion: '^1.82.0', eager: true },
            zustand: { singleton: true, requiredVersion: '^5.0.0', eager: true },
            '@edforge/ui': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/abac': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/types': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/theme': { singleton: true, requiredVersion: '0.0.1', eager: true },
            'react-hook-form': { singleton: true, eager: true },
            zod: { singleton: true, eager: true },
            '@hookform/resolvers': { singleton: true, eager: true },
            'framer-motion': { singleton: true, eager: true },
            '@react-spring/web': { singleton: true, eager: true },
          },
        }),
      ])
    },
  },
})

