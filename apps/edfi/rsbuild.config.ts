import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3001,
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
      config.output = {
        ...config.output,
        // Remotes use 'auto' to resolve chunk URLs from their own origin (e.g. localhost:3001).
        // The Shell host uses '/' instead — see apps/shell/rsbuild.config.ts for rationale.
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
            // Auth - CRITICAL: Share Shell's Amplify instance to prevent split-brain auth state
            '@edforge/auth': { singleton: true, requiredVersion: '0.0.1', eager: true },
            'aws-amplify': { singleton: true, eager: true },
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
            '@tanstack/react-router': { singleton: true, requiredVersion: '^1.82.0', eager: true },
            zustand: { singleton: true, requiredVersion: '^5.0.0', eager: true },
            '@edforge/ui': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/abac': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/types': { singleton: true, requiredVersion: '0.0.1', eager: true },
            '@edforge/theme': { singleton: true, requiredVersion: '0.0.1', eager: true },
          },
        }),
      ])
    },
  },
})

