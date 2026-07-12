import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex bg-rail-bg">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="rail-line w-full h-full" />
        </div>
        <div className="relative flex items-center gap-2">
          <div className="w-2 h-8 rail-line rounded-full" />
          <span className="font-display font-semibold text-xl text-white">TransitOps</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-semibold text-white leading-tight mb-4">
            One console for<br />every vehicle,<br />driver, and trip.
          </h1>
          <p className="text-slate-400 text-sm max-w-sm">
            Dispatch, maintenance, and fuel tracking — with the business rules
            enforced automatically, not by whoever remembers the spreadsheet.
          </p>
        </div>
        <div className="relative flex items-center gap-6 text-xs text-slate-500 font-mono">
          <span>DISPATCH</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>MAINTENANCE</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>ANALYTICS</span>
        </div>
      </div>

      {/* Right: login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#F4F6F8]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-2 h-8 rail-line rounded-full" />
            <span className="font-display font-semibold text-xl text-rail-bg">TransitOps</span>
          </div>

          <h2 className="text-xl font-display font-semibold text-rail-bg mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your operator credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@transitops.com"
                className="input-field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <LogIn size={16} />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Roles: Fleet Manager · Driver · Safety Officer · Financial Analyst
          </p>
        </div>
      </div>
    </div>
  )
}
