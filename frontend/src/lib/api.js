// src/lib/api.js
// Shared Axios instance.
//
// BASE URL STRATEGY:
//   Development : baseURL = "" (empty string)
//     → All requests go to the same origin (Vite dev server at :5174).
//     → Vite's proxy config forwards /api/* to the Express backend at :3001.
//     → No CORS headers required; the browser never makes a cross-origin call.
//
//   Production  : set VITE_API_URL in your deployment environment
//     → e.g. VITE_API_URL=https://your-backend.railway.app
//     → Requests go directly to the production backend.
//     → Backend must have CORS configured with the production frontend URL.
import axios from "axios";

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? "",
  headers:         { "Content-Type": "application/json" },
  withCredentials: true,
});

export default api;
