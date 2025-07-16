import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/personal-asset-dashboard/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          icons: ['lucide-react']
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_NOTION_API_KEY': JSON.stringify(process.env.VITE_NOTION_API_KEY),
    'import.meta.env.VITE_NOTION_HEALTH_DB_ID': JSON.stringify(process.env.VITE_NOTION_HEALTH_DB_ID),
    'import.meta.env.VITE_NOTION_COGNITIVE_DB_ID': JSON.stringify(process.env.VITE_NOTION_COGNITIVE_DB_ID),
    'import.meta.env.VITE_NOTION_CONTENT_DB_ID': JSON.stringify(process.env.VITE_NOTION_CONTENT_DB_ID),
    'import.meta.env.VITE_NOTION_FOCUS_DB_ID': JSON.stringify(process.env.VITE_NOTION_FOCUS_DB_ID)
  }
})