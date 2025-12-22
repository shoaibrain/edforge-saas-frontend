import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack'

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3002,
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
          name: 'academics',
          filename: 'remoteEntry.js',
          exposes: {
            './StudentsModule': './src/routes/students/index.tsx',
            './TeachersModule': './src/routes/teachers/index.tsx',
            './AttendanceModule': './src/routes/attendance/index.tsx',
            './GradebookModule': './src/routes/gradebook/index.tsx',
            './EnrollmentModule': './src/routes/enrollment/index.tsx',
            './AcademicsModule': './src/bootstrap.tsx',
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

