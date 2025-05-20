import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['@react-oauth/google'],
    },
  },
  server: {
    proxy: {
      '/api': 'https://hirewave1.onrender.com',
    },
  },
})
