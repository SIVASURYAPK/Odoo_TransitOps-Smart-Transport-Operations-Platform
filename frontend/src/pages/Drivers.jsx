import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { DRIVER_STATUS } from '../utils/constants'

const EMPTY_FORM = {
  name: '',
  license_number: '',
  license_category: '',
  license_expiry_date: '',
  contact_number: '',
  safety_score: '',
  status: DRIVER_STATUS.AVAILABLE,
}

function isExpired(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Matches backend/app/routers/drivers.py
  const loadDrivers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axiosClient.get('/drivers')
      setDrivers(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load drivers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDrivers() }, [loadDrivers])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (driver) => {
    setEditingId(driver.id)
    setForm({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: driver.license_expiry_date?.slice(0, 10) || '',
      contact_number: driver.contact_number,
      safety_score: driver.safety_score,
      status: driver.status,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = { ...form, safety_score: Number(form.safety_score) }
    try {
      if (editingId) {
        await axiosClient.put(`/drivers/${editingId}`, payload)
      } else {
        await axiosClient.post('/drivers', payload)
      }
      setModalOpen(false)
      await loadDrivers()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not save driver.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (driver) => {
    if (!confirm(`Remove driver ${driver.name}? This cannot be undone.`)) return
    try {
      await axiosClient.delete(`/drivers/${driver.id}`)
      await loadDrivers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete driver.')
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'license_number', label: 'License No.', sortable: true, render: (d) => <span className="font-mono text-xs">{d.license_number}</span> },
    { key: 'license_category', label: 'Category', sortable: true },
    {
      key: 'license_expiry_date',
      label: 'License Expiry',
      sortable: true,
      render: (d) => (
        <span className={`text-xs font-mono flex items-center gap-1 ${isExpired(d.license_expiry_date) ? 'text-red-600' : 'text-slate-600'}`}>
          {isExpired(d.license_expiry_date) && <AlertTriangle size={12} />}
          {d.license_expiry_date?.slice(0, 10)}
        </span>
      ),
    },
    { key: 'contact_number', label: 'Contact', sortable: false },
    { key: 'safety_score', label: 'Safety Score', sortable: true, render: (d) => <span className="font-mono text-xs">{d.safety_score}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (d) => <StatusBadge status={d.status} /> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Drivers</h1>
          <p className="text-sm text-slate-500 mt-1">Expired licenses and suspended drivers are auto-excluded from dispatch.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <DataTable
        columns={columns}
        data={drivers}
        searchKeys={['name', 'license_number', 'license_category', 'contact_number']}
        emptyMessage={loading ? 'Loading drivers…' : 'No drivers registered yet.'}
        actions={(driver) => (
          <>
            <button onClick={() => openEdit(driver)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Edit">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleDelete(driver)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Delete">
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">{editingId ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-field">Full Name</label>
                  <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">License Number</label>
                  <input required value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">License Category</label>
                  <input required value={form.license_category} onChange={(e) => setForm((f) => ({ ...f, license_category: e.target.value }))} className="input-field" placeholder="e.g. LMV" />
                </div>
                <div>
                  <label className="label-field">License Expiry Date</label>
                  <input required type="date" value={form.license_expiry_date} onChange={(e) => setForm((f) => ({ ...f, license_expiry_date: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Contact Number</label>
                  <input required value={form.contact_number} onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Safety Score (0–100)</label>
                  <input required type="number" min="0" max="100" value={form.safety_score} onChange={(e) => setForm((f) => ({ ...f, safety_score: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input-field">
                    {Object.values(DRIVER_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
