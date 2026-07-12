import { useEffect, useState, useCallback } from 'react'
import { Plus, X, CheckCircle2 } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { MAINTENANCE_STATUS, VEHICLE_STATUS } from '../utils/constants'

const EMPTY_FORM = { vehicle_id: '', description: '' }

export default function Maintenance() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Matches backend/app/routers/maintenance.py + vehicles.py
  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [recRes, vehRes] = await Promise.all([
        axiosClient.get('/maintenance'),
        axiosClient.get('/vehicles'),
      ])
      setRecords(recRes.data)
      setVehicles(vehRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load maintenance records.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Any vehicle not already In Shop can be sent for maintenance.
  const eligibleVehicles = vehicles.filter((v) => v.status !== 'In Shop' && v.status !== VEHICLE_STATUS.RETIRED)

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      // Backend atomically creates Open record + flips Vehicle -> In Shop
      await axiosClient.post('/maintenance', {
        vehicle_id: Number(form.vehicle_id),
        description: form.description,
      })
      setModalOpen(false)
      await loadAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not create maintenance record.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async (record) => {
    const costInput = prompt('Enter the maintenance cost to close this record (₹)')
    if (costInput === null) return
    const cost = Number(costInput)
    if (Number.isNaN(cost) || cost < 0) {
      return alert('Please enter a valid cost amount.')
    }

    try {
      await axiosClient.post(`/maintenance/${record.id}/close`, { cost })
      await loadAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not close maintenance record.')
    }
  }

  const columns = [
    { key: 'vehicle', label: 'Vehicle', render: (r) => {
        const vehicle = vehicles.find((v) => v.id === r.vehicle_id)
        return vehicle ? `${vehicle.license_plate} — ${vehicle.model}` : '—'
      }
    },
    { key: 'description', label: 'Description' },
    { key: 'cost', label: 'Cost', sortable: true, render: (r) => <span className="font-mono text-xs">₹{Number(r.cost).toLocaleString()}</span> },
    { key: 'start_date', label: 'Opened', sortable: true, render: (r) => <span className="font-mono text-xs">{r.start_date?.toString()}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Maintenance</h1>
          <p className="text-sm text-slate-500 mt-1">Opening a record puts the vehicle In Shop and out of the dispatch pool.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Record
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <DataTable
        columns={columns}
        data={records}
        searchKeys={['description']}
        emptyMessage={loading ? 'Loading maintenance records…' : 'No maintenance records yet.'}
        actions={(record) =>
          record.status === MAINTENANCE_STATUS.OPEN && (
            <button onClick={() => handleClose(record)} className="p-1.5 rounded-md hover:bg-green-50 text-green-600" title="Close & restore vehicle">
              <CheckCircle2 size={15} />
            </button>
          )
        }
      />

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">New Maintenance Record</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="label-field">Vehicle</label>
                <select required value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))} className="input-field">
                  <option value="">Select a vehicle…</option>
                  {eligibleVehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration_number} — {v.name_model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field" rows={3} />
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Open Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
