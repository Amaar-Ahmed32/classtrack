import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api calls proxy to the Express backend so the frontend needs no
// CORS workaround. In production set VITE_API_URL to the deployed API origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
