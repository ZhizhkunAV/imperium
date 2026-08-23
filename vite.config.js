import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  publicDir: 'assets',
  server: {
    open: true,
    fs: {
      allow: [
        path.resolve(__dirname, '.'),
      ]
    }
  }
})