import { fileURLToPath } from 'url'
import path from 'path'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'
import { getMFSharedConfig } from '@edforge/config/mf-shared'

export default defineConfig({
  plugins: [pluginReact()],
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
          shared: getMFSharedConfig('remote'),
        }),
      ])
    },
  },
})
