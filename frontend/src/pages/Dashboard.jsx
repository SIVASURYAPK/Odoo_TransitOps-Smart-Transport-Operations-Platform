import { useEffect, useState, useCallback } from 'react'
import { Truck, CheckCircle2, Wrench, Navigation, Clock, Users, Gauge } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axiosClient from '../api/axiosClient'
import { VEHICLE_TYPES, REGIONS, VEHICLE_STATUS } from '../utils/constants'

const KPI_DEFS = [
  { key: 'active_vehicles', label: 'Active Vehicles', icon: Truck, tone: 'text-blue-600 bg-blue-50' },
  { key: 'available_vehicles', label: 'Available Vehicles', icon: CheckCircle2, tone: 'text-green-600 bg-green-50' },
  { key: 'vehicles_in_maintenance', label: 'In Maintenance', icon: Wrench, tone: 'text-amber-600 bg-amber-50' },
  { key: 'active_trips', label: 'Active Trips', icon: Navigation, tone: 'text-teal-600 bg-teal-50' },
  { key: 'pending_trips', label: 'Pending Trips', icon: Clock, tone: 'text-violet-600 bg-violet-50' },
  { key: 'drivers_on_duty', label: 'Drivers On Duty', icon: Users, tone: 'text-indigo-600 bg-indigo-50' },
  { key: 'fleet_utilization_pct', label: 'Fleet Utilization', icon: Gauge, tone: 'text-rose-600 bg-rose-50', suffix: '%' },
]

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [utilizationTrend, setUtilizationTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ type: '', status: '', region: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      // Matches backend/app/routers/dashboard.py -> GET /dashboard/summary, GET /dashboard/utilization-trend
      const [summaryRes, trendRes] = await Promise.all([
        axiosClient.get('/dashboard/summary', { params }),
        axiosClient.get('/dashboard/utilization-trend', { params }).catch(() => ({ data: [] })),
      ])
      setSummary(summaryRes.data)
      setUtilizationTrend(trendRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live fleet status across your operation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            className="input-field w-auto text-sm"
          >
            <option value="">All types</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="input-field w-auto text-sm"
          >
            <option value="">All statuses</option>
            {Object.values(VEHICLE_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.region}
            onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
            className="input-field w-auto text-sm"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {KPI_DEFS.map(({ key, label, icon: Icon, tone, suffix }) => (
          <div key={key} className="card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-display font-semibold text-rail-bg font-mono">
              {loading ? '—' : `${summary?.[key] ?? 0}${suffix || ''}`}
            </div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-rail-bg mb-4">Fleet Utilization Trend</h2>
        {utilizationTrend.length === 0 ? (
          <div className="text-sm text-slate-400 py-12 text-center">
            {loading ? 'Loading chart…' : 'No trend data available yet.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={utilizationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} unit="%" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E2E8F0' }} />
              <Bar dataKey="utilization" fill="#14B8A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
