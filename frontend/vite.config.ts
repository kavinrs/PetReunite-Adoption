// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // forward /auth, /users, /admin to Django backend
      '/auth': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
      '/users': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
      '/admin': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
    }
  }
});
