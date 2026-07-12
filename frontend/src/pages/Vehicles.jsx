import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { VEHICLE_STATUS } from '../utils/constants'

const EMPTY_FORM = {
  license_plate: '',
  model: '',
  max_capacity_kg: '',
  odometer_km: '',
  status: VEHICLE_STATUS.AVAILABLE,
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Matches backend/app/routers/vehicles.py
  const loadVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axiosClient.get('/vehicles')
      setVehicles(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadVehicles() }, [loadVehicles])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const hasFieldMismatch = () => {
    return false
  }

  const openEdit = (vehicle) => {
    setEditingId(vehicle.id)
    setForm({
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      max_capacity_kg: vehicle.max_capacity_kg,
      odometer_km: vehicle.odometer_km,
      status: vehicle.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      ...form,
      max_capacity_kg: Number(form.max_capacity_kg),
      odometer_km: Number(form.odometer_km),
    }
    try {
      if (editingId) {
        await axiosClient.put(`/vehicles/${editingId}`, payload)
      } else {
        await axiosClient.post('/vehicles', payload)
      }
      setModalOpen(false)
      await loadVehicles()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not save vehicle.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicle) => {
    if (!confirm(`Remove vehicle ${vehicle.license_plate}? This cannot be undone.`)) return
    try {
      await axiosClient.delete(`/vehicles/${vehicle.id}`)
      await loadVehicles()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete vehicle.')
    }
  }

  const columns = [
    { key: 'license_plate', label: 'Reg. No.', sortable: true, render: (v) => <span className="font-mono text-xs">{v.license_plate}</span> },
    { key: 'model', label: 'Name / Model', sortable: true },
    { key: 'max_capacity_kg', label: 'Max Load', sortable: true, render: (v) => `${v.max_capacity_kg} kg` },
    { key: 'odometer_km', label: 'Odometer', sortable: true, render: (v) => <span className="font-mono text-xs">{v.odometer_km.toLocaleString()} km</span> },
    { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v.status} /> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Vehicles</h1>
          <p className="text-sm text-slate-500 mt-1">Master registry — registration numbers are unique.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <DataTable
        columns={columns}
        data={vehicles}
        searchKeys={['license_plate', 'model', 'status']}
        emptyMessage={loading ? 'Loading vehicles…' : 'No vehicles registered yet.'}
        actions={(vehicle) => (
          <>
            <button onClick={() => openEdit(vehicle)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Edit">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleDelete(vehicle)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Delete">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">
                {editingId ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">License Plate</label>
                  <input required value={form.license_plate} onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))} className="input-field" placeholder="e.g. TN-01-AA-1234" />
                </div>
                <div>
                  <label className="label-field">Model</label>
                  <input required value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Max Load Capacity (kg)</label>
                  <input required type="number" min="0" value={form.max_capacity_kg} onChange={(e) => setForm((f) => ({ ...f, max_capacity_kg: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Odometer (km)</label>
                  <input required type="number" min="0" value={form.odometer_km} onChange={(e) => setForm((f) => ({ ...f, odometer_km: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input-field">
                    {Object.values(VEHICLE_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
