import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/services": path.resolve(__dirname, "./src/services"),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@storybook/*']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-icons'],
        },
      },
    },
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
})
