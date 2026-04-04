import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'
import { getMFSharedConfig } from '@edforge/config/mf-shared'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3002,
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
          name: 'academics',
          filename: 'remoteEntry.js',
          exposes: {
            './StudentsModule': './src/routes/students/index.tsx',
            './AttendanceModule': './src/routes/attendance/index.tsx',
            './GradebookModule': './src/routes/gradebook/index.tsx',
            './EnrollmentModule': './src/routes/enrollment/index.tsx',
            './AcademicsModule': './src/bootstrap.tsx',
          },
          shared: getMFSharedConfig('remote'),
        }),
      ])
    },
  },
})

