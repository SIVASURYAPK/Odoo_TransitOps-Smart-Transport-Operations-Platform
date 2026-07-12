import axios from 'axios'

// Vite dev server proxies /api -> http://localhost:8001 (see vite.config.js).
// In production, set VITE_API_BASE_URL to your deployed FastAPI URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api'

const axiosClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the JWT to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token')
  const headers = config.headers || {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return { ...config, headers }
})

// Do not clear the session automatically for navigation errors; let the page handle the issue.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default axiosClient
