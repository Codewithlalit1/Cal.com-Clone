// src/lib/api.js
// Shared Axios instance — all API calls go through this so the base URL is
// configured in a single place.
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default api;
