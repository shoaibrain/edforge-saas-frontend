import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    // Transpile shared-types source directly (dist/ not available on Vercel)
    include: [/types\/packages\/shared-types\/src/],
  },
  server: {
    port: 3006,
    cors: true,
    historyApiFallback: true, // Critical for SPA routing
  },
  dev: {
    hmr: true,
    client: {
      host: 'localhost',
      port: '<port>',
      protocol: 'ws',
    },
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
          '@edforge/shared-types': path.resolve(monorepoRoot, 'types/packages/shared-types/src'),
        },
      }
      config.output = {
        ...config.output,
        publicPath: 'auto',
      }
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'people',
          filename: 'remoteEntry.js',
          exposes: {
            './PeopleModule': './src/bootstrap.tsx',
          },
          shared: {
            // Auth - CRITICAL: Share Shell's Amplify instance to prevent split-brain auth state
            '@edforge/auth': { singleton: true, requiredVersion: '0.0.1', eager: true },
            'aws-amplify': { singleton: true, eager: true },
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
            '@tanstack/react-router': { singleton: true, requiredVersion: '^1.82.0', eager: true },
            '@tanstack/react-table': { singleton: true, eager: true },
            zustand: { singleton: true, requiredVersion: '^5.0.0', eager: true },
            '@edforge/ui': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/abac': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/types': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/theme': { singleton: true, requiredVersion: '0.0.1', eager: true },
            'react-hook-form': { singleton: true, eager: true },
            zod: { singleton: true, eager: true },
            '@hookform/resolvers': { singleton: true, requiredVersion: '^3.9.0', eager: true },
            'framer-motion': { singleton: true, eager: true },
            '@react-spring/web': { singleton: true, eager: true },
          },
        }),
      ])
    },
  },
})
