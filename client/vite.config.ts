import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react()],
  
  // Build optimization
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            router: ["react-router-dom"],
            ui: ["@headlessui/react", "@heroicons/react"],
            utils: ["lodash", "date-fns", "clsx"],
          },
        },
      },
      minify: "terser",
      sourcemap: !isProduction,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: true,
        },
      },
    },
  
  // Security headers
    server: {
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  
  // Preview server security
    preview: {
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  
  // Environment variables validation
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
  
  // Path resolution
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "@/components": resolve(__dirname, "./src/components"),
        "@/pages": resolve(__dirname, "./src/pages"),
        "@/utils": resolve(__dirname, "./src/utils"),
        "@/hooks": resolve(__dirname, "./src/hooks"),
        "@/store": resolve(__dirname, "./src/store"),
        "@/security": resolve(__dirname, "./src/security"),
        "@/config": resolve(__dirname, "./src/config"),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  
  // CSS optimization
    css: {
      devSourcemap: false,
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
  
  // Optimized dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "zustand",
        "axios",
        "date-fns",
        "clsx",
        "dompurify",
      ],
    },
  };
});