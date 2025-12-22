import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3001,
    cors: true,
  },
  dev: {
    hmr: true,
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
          name: 'edfi',
          filename: 'remoteEntry.js',
          exposes: {
            './ConnectionWizard': './src/components/connection/ConnectionWizard.tsx',
            './DescriptorMapper': './src/components/mapping/DescriptorMapper.tsx',
            './SyncDashboard': './src/components/sync/SyncDashboard.tsx',
            './ErrorAggregator': './src/components/errors/ErrorAggregator.tsx',
            './EdFiModule': './src/bootstrap.tsx',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^19.0.0' },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
            '@tanstack/react-query': { singleton: true },
            zustand: { singleton: true },
            '@edforge/ui': { singleton: true },
            '@edforge/abac': { singleton: true },
            '@edforge/types': { singleton: true },
            '@edforge/theme': { singleton: true },
          },
        }),
      ])
    },
  },
})

