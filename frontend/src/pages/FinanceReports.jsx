import { useEffect, useState, useCallback } from 'react'
import { Download, Plus, X, Fuel, Receipt, TrendingUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axiosClient from '../api/axiosClient'
import DataTable from '../components/DataTable'
import { EXPENSE_CATEGORY } from '../utils/constants'

const TABS = [
  { key: 'overview', label: 'Overview', icon: TrendingUp },
  { key: 'fuel', label: 'Fuel Logs', icon: Fuel },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
]

const EMPTY_FUEL_FORM = { vehicle_id: '', trip_id: '', liters: '', cost: '', date: '' }
const EMPTY_EXPENSE_FORM = { vehicle_id: '', category: EXPENSE_CATEGORY.TOLL, amount: '', date: '', description: '' }

export default function FinanceReports() {
  const [tab, setTab] = useState('overview')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Overview report data
  const [fuelEfficiency, setFuelEfficiency] = useState([])
  const [operationalCost, setOperationalCost] = useState([])
  const [roi, setRoi] = useState([])

  // Fuel logs
  const [fuelLogs, setFuelLogs] = useState([])
  const [fuelModalOpen, setFuelModalOpen] = useState(false)
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL_FORM)
  const [fuelSaving, setFuelSaving] = useState(false)
  const [fuelError, setFuelError] = useState(null)

  // Expenses
  const [expenses, setExpenses] = useState([])
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE_FORM)
  const [expenseSaving, setExpenseSaving] = useState(false)
  const [expenseError, setExpenseError] = useState(null)

  // Matches backend/app/routers/reports.py and vehicles.py
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vehRes, feRes, ocRes, roiRes, fuelRes, expRes] = await Promise.all([
        axiosClient.get('/vehicles'),
        axiosClient.get('/reports/fuel-efficiency').catch(() => ({ data: [] })),
        axiosClient.get('/reports/operational-cost').catch(() => ({ data: [] })),
        axiosClient.get('/reports/roi').catch(() => ({ data: [] })),
        axiosClient.get('/reports/fuel-logs').catch(() => ({ data: [] })),
        axiosClient.get('/reports/expenses').catch(() => ({ data: [] })),
      ])
      setVehicles(vehRes.data)
      setFuelEfficiency(feRes.data)
      setOperationalCost(ocRes.data)
      setRoi(roiRes.data)
      setFuelLogs(fuelRes.data)
      setExpenses(expRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const vehicleLabel = (id) => vehicles.find((v) => v.id === id)?.registration_number || '—'

  const handleExportCsv = async () => {
    try {
      const { data } = await axiosClient.get('/reports/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `transitops-report-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert(err.response?.data?.detail || 'CSV export failed.')
    }
  }

  const openFuelModal = () => {
    setFuelForm(EMPTY_FUEL_FORM)
    setFuelError(null)
    setFuelModalOpen(true)
  }

  const handleFuelSave = async (e) => {
    e.preventDefault()
    setFuelSaving(true)
    setFuelError(null)
    try {
      await axiosClient.post('/reports/fuel-logs', {
        ...fuelForm,
        trip_id: fuelForm.trip_id || null,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
      })
      setFuelModalOpen(false)
      await loadAll()
    } catch (err) {
      setFuelError(err.response?.data?.detail || 'Could not save fuel log.')
    } finally {
      setFuelSaving(false)
    }
  }

  const openExpenseModal = () => {
    setExpenseForm(EMPTY_EXPENSE_FORM)
    setExpenseError(null)
    setExpenseModalOpen(true)
  }

  const handleExpenseSave = async (e) => {
    e.preventDefault()
    setExpenseSaving(true)
    setExpenseError(null)
    try {
      await axiosClient.post('/reports/expenses', { ...expenseForm, amount: Number(expenseForm.amount) })
      setExpenseModalOpen(false)
      await loadAll()
    } catch (err) {
      setExpenseError(err.response?.data?.detail || 'Could not save expense.')
    } finally {
      setExpenseSaving(false)
    }
  }

  const fuelColumns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => vehicleLabel(r.vehicle_id) },
    { key: 'date', label: 'Date', sortable: true, render: (r) => <span className="font-mono text-xs">{r.date?.slice(0, 10)}</span> },
    { key: 'liters', label: 'Liters', sortable: true, render: (r) => `${r.liters} L` },
    { key: 'cost', label: 'Cost', sortable: true, render: (r) => <span className="font-mono text-xs">₹{Number(r.cost).toLocaleString()}</span> },
  ]

  const expenseColumns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => vehicleLabel(r.vehicle_id) },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (r) => <span className="font-mono text-xs">₹{Number(r.amount).toLocaleString()}</span> },
    { key: 'date', label: 'Date', sortable: true, render: (r) => <span className="font-mono text-xs">{r.date?.slice(0, 10)}</span> },
    { key: 'description', label: 'Description' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Reports & Finance</h1>
          <p className="text-sm text-slate-500 mt-1">Fuel efficiency, operational cost, ROI, and expense tracking.</p>
        </div>
        <button onClick={handleExportCsv} className="btn-secondary flex items-center gap-2">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-accent text-accent' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-rail-bg mb-4">Fuel Efficiency (km/L) by Vehicle</h2>
              {fuelEfficiency.length === 0 ? (
                <div className="text-sm text-slate-400 py-16 text-center">{loading ? 'Loading…' : 'No fuel efficiency data yet.'}</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fuelEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="vehicle" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E2E8F0' }} />
                    <Bar dataKey="km_per_liter" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-rail-bg mb-4">Operational Cost (Fuel + Maintenance)</h2>
              {operationalCost.length === 0 ? (
                <div className="text-sm text-slate-400 py-16 text-center">{loading ? 'Loading…' : 'No cost data yet.'}</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={operationalCost}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E2E8F0' }} />
                    <Line type="monotone" dataKey="total_cost" stroke="#2563EB" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <h2 className="text-sm font-semibold text-rail-bg px-5 pt-5 mb-2">Vehicle ROI</h2>
            <p className="text-xs text-slate-500 px-5 mb-3">(Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Fuel + Maintenance</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roi.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">{loading ? 'Loading…' : 'No ROI data yet.'}</td></tr>
                ) : (
                  roi.map((r) => (
                    <tr key={r.vehicle_id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-3 font-mono text-xs">{r.vehicle}</td>
                      <td className="px-5 py-3">₹{Number(r.revenue).toLocaleString()}</td>
                      <td className="px-5 py-3">₹{Number(r.costs).toLocaleString()}</td>
                      <td className={`px-5 py-3 font-mono font-medium ${r.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(r.roi * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'fuel' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openFuelModal} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Log Fuel
            </button>
          </div>
          <DataTable columns={fuelColumns} data={fuelLogs} emptyMessage={loading ? 'Loading fuel logs…' : 'No fuel logs yet.'} />
        </>
      )}

      {tab === 'expenses' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openExpenseModal} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Expense
            </button>
          </div>
          <DataTable columns={expenseColumns} data={expenses} emptyMessage={loading ? 'Loading expenses…' : 'No expenses logged yet.'} />
        </>
      )}

      {/* Fuel log modal */}
      {fuelModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">Log Fuel</h3>
              <button onClick={() => setFuelModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleFuelSave} className="p-5 space-y-4">
              <div>
                <label className="label-field">Vehicle</label>
                <select required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm((f) => ({ ...f, vehicle_id: e.target.value }))} className="input-field">
                  <option value="">Select a vehicle…</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Liters</label>
                <input required type="number" min="0" step="0.1" value={fuelForm.liters} onChange={(e) => setFuelForm((f) => ({ ...f, liters: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-field">Cost</label>
                <input required type="number" min="0" value={fuelForm.cost} onChange={(e) => setFuelForm((f) => ({ ...f, cost: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-field">Date</label>
                <input required type="date" value={fuelForm.date} onChange={(e) => setFuelForm((f) => ({ ...f, date: e.target.value }))} className="input-field" />
              </div>
              {fuelError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fuelError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFuelModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={fuelSaving} className="btn-primary">{fuelSaving ? 'Saving…' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">Add Expense</h3>
              <button onClick={() => setExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleExpenseSave} className="p-5 space-y-4">
              <div>
                <label className="label-field">Vehicle</label>
                <select required value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm((f) => ({ ...f, vehicle_id: e.target.value }))} className="input-field">
                  <option value="">Select a vehicle…</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Category</label>
                <select value={expenseForm.category} onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
                  {Object.values(EXPENSE_CATEGORY).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Amount</label>
                <input required type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-field">Date</label>
                <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-field">Description</label>
                <input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} className="input-field" />
              </div>
              {expenseError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{expenseError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setExpenseModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={expenseSaving} className="btn-primary">{expenseSaving ? 'Saving…' : 'Save Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
