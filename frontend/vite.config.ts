import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Define global constants for environment variables
    __ENV__: {
      REACT_APP_IOT_SERVER_URL: JSON.stringify(process.env.VITE_IOT_SERVER_URL || 'ws://localhost:8080'),
      REACT_APP_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8080'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
          map: ['react-leaflet', 'leaflet'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@mui/icons-material'],
  },
})
