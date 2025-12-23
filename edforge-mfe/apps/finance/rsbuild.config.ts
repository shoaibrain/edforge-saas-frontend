import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3003,
    cors: true,
    historyApiFallback: true, // Critical for SPA routing
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
          name: 'finance',
          filename: 'remoteEntry.js',
          exposes: {
            './BillingModule': './src/routes/billing/index.tsx',
            './PayrollModule': './src/routes/payroll/index.tsx',
            './TuitionModule': './src/routes/tuition/index.tsx',
            './ExpensesModule': './src/routes/expenses/index.tsx',
            './FinanceModule': './src/bootstrap.tsx',
          },
          shared: {
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
          },
        }),
      ])
    },
  },
})

