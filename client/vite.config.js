import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://youtube-clone-j6li.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
