import axios from "axios";

const api = axios.create({
  // Prefer VITE_BACKEND_URL (set in .env), fall back to older VITE_API_URL,
  // and finally default to "/" so the Vite dev proxy can handle "/api" calls.
  baseURL: import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "/",
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Try to initialize token from localStorage (browser only)
try {
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);
} catch (e) {
  // ignore (e.g. SSR or inaccessible localStorage)
}

export default api;
