import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'

// Guards a route group behind authentication, and optionally behind a role allowlist.
// Usage: <Route element={<ProtectedRoute allowedRoles={['FleetManager']} />}>...</Route>
// Omit allowedRoles to allow any authenticated role.
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="text-sm text-slate-500 font-mono">Loading session…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-screen bg-[#F4F6F8]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-display font-semibold text-rail-bg mb-1">Access restricted</div>
            <p className="text-sm text-slate-500">Your role doesn't have permission to view this page.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F8]">
      <Navbar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
