import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3005,
    cors: true,
    historyApiFallback: true,
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
          name: 'specialPrograms',
          filename: 'remoteEntry.js',
          exposes: {
            './SpecialProgramsModule': './src/bootstrap.tsx',
            './IEPsModule': './src/routes/ieps/index.tsx',
            './504PlansModule': './src/routes/504-plans/index.tsx',
            './AccommodationsModule': './src/routes/accommodations/index.tsx',
            './AccessibilityModule': './src/routes/accessibility/index.tsx',
            './CounselingModule': './src/routes/counseling/index.tsx',
            './InterventionsModule': './src/routes/interventions/index.tsx',
          },
          shared: {
            react: { singleton: true, requiredVersion: '^19.0.0', eager: true },
            'react-dom': { singleton: true, requiredVersion: '^19.0.0', eager: true },
            '@tanstack/react-query': { singleton: true, requiredVersion: '^5.60.0', eager: true },
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

