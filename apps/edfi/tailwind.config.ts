import type { Config } from 'tailwindcss'
import sharedConfig from '../../packages/config/tailwind.config'

const config: Config = {
  ...sharedConfig,
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/theme/src/**/*.{ts,tsx,css}', 
  ],
}

export default config
