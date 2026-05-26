import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'
import { getMFSharedConfig } from '@edforge/config/mf-shared'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3003,
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
        publicPath: 'auto',
      }
      appendPlugins([
        new ModuleFederationPlugin({
          name: 'finance',
          filename: 'remoteEntry.js',
          exposes: {
            './FinanceModule': './src/bootstrap.tsx',
          },
          // Canonical shared config from `@edforge/config/mf-shared` —
          // single source of truth across shell + every MFE. The
          // previous hand-rolled list here had drifted (no i18n
          // singletons, @hookform/resolvers version mismatch with
          // shell, missing @edforge/forms / @edforge/config /
          // @edforge/date-utils), which broke M1.5's i18n button
          // label on the Invoice detail page in prod (the button
          // rendered the raw key `actions.downloadPdf` because
          // finance's react-i18next was a separate uninitialized
          // copy from shell's). Adopting the canonical helper is
          // what apps/{shell,academics,people} already do.
          shared: getMFSharedConfig('remote'),
        }),
      ])
    },
  },
})

