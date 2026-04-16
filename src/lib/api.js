// API base URL — set VITE_API_URL in .env for production deployments
// e.g. VITE_API_URL=https://your-backend.railway.app
// Leave empty for local dev (proxied via Vite to localhost:3001)
export const API_BASE = import.meta.env.VITE_API_URL || ''
