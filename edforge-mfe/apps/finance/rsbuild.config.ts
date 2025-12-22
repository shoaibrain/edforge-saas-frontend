import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3003,
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
            react: { singleton: true, requiredVersion: '^19.0.0' },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
            '@tanstack/react-query': { singleton: true },
            '@tanstack/react-table': { singleton: true },
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

