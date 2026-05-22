import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // ── Dev Proxy ──────────────────────────────────────────────────────────────
    // Forwards /api/* requests from the Vite dev server to the Express backend.
    //
    // WHY THIS IS BETTER THAN CORS:
    //   Without a proxy, the browser makes cross-origin requests
    //   (localhost:5174 → localhost:3001) and CORS headers must be present on
    //   every response — including error responses. If the backend throws a 500
    //   before the CORS middleware can set headers, the browser reports a
    //   confusing "CORS error" that masks the real problem.
    //
    //   With the proxy, ALL requests go to localhost:5174 (same origin).
    //   The Vite dev server forwards /api/* to port 3001 internally.
    //   The browser never sees a cross-origin request, so CORS is irrelevant.
    //   Real backend errors (400, 500) surface directly in the console.
    proxy: {
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
})
