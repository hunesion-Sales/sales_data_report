import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('exceljs')) return 'vendor-excel'
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
