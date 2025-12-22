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
            edfi: 'edfi@http://localhost:3001/mf-manifest.json',
            academics: 'academics@http://localhost:3002/mf-manifest.json',
            finance: 'finance@http://localhost:3003/mf-manifest.json',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            '@tanstack/react-query': { singleton: true, eager: true },
            '@tanstack/react-router': { singleton: true, eager: true },
            zustand: { singleton: true, eager: true },
            '@edforge/ui': { singleton: true, eager: true },
            '@edforge/abac': { singleton: true, eager: true },
            '@edforge/types': { singleton: true, eager: true },
            '@edforge/theme': { singleton: true, eager: true },
          },
        }),
      ])
    },
  },
})

