import { useEffect, useState, useCallback, useMemo } from 'react'
import { Plus, X, Send, CheckCircle2, XCircle } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import { TRIP_STATUS, VEHICLE_STATUS, DRIVER_STATUS } from '../utils/constants'

const EMPTY_FORM = {
  source: '',
  destination: '',
  vehicle_id: '',
  driver_id: '',
  cargo_weight: '',
  planned_distance: '',
}

const EMPTY_COMPLETE_FORM = { actual_distance: '', fuel_consumed: '' }

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [completeTarget, setCompleteTarget] = useState(null)
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE_FORM)
  const [completeError, setCompleteError] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Matches backend/app/routers/trips.py, vehicles.py, drivers.py
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axiosClient.get('/trips'),
        axiosClient.get('/vehicles'),
        axiosClient.get('/drivers'),
      ])
      setTrips(tripsRes.data)
      setVehicles(vehiclesRes.data)
      setDrivers(driversRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load trip data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Business rule: dispatch pool only shows Available vehicles / Available, non-expired, non-suspended drivers.
  const availableVehicles = useMemo(
    () => vehicles.filter((v) => String(v.status).toLowerCase() === String(VEHICLE_STATUS.AVAILABLE).toLowerCase()),
    [vehicles]
  )
  const availableDrivers = useMemo(
    () =>
      drivers.filter(
        (d) =>
          String(d.status).toLowerCase() === String(DRIVER_STATUS.AVAILABLE).toLowerCase() &&
          (!d.license_expiry_date || new Date(d.license_expiry_date) >= new Date())
      ),
    [drivers]
  )

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(form.vehicle_id))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setCreateOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Client-side pre-check mirrors backend rule; backend remains the source of truth.
    if (selectedVehicle && Number(form.cargo_weight) > selectedVehicle.max_capacity_kg) {
      setFormError(`Cargo weight exceeds ${selectedVehicle.model}'s max load of ${selectedVehicle.max_capacity_kg} kg.`)
      return
    }

    setSaving(true)
    try {
      await axiosClient.post('/trips/dispatch', {
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight_kg: Number(form.cargo_weight),
      })
      setCreateOpen(false)
      await loadAll()
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Could not create trip.')
    } finally {
      setSaving(false)
    }
  }

  const handleDispatch = async (trip) => {
    try {
      // Backend atomically flips Trip -> Dispatched, Vehicle + Driver -> OnTrip
      await axiosClient.post(`/trips/${trip.id}/dispatch`)
      await loadAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not dispatch trip.')
    }
  }

  const openComplete = (trip) => {
    setCompleteTarget(trip)
    setCompleteForm(EMPTY_COMPLETE_FORM)
    setCompleteError(null)
  }

  const handleComplete = async (e) => {
    e.preventDefault()
    setCompleteError(null)
    try {
      // Backend atomically flips Trip -> Completed, Vehicle + Driver -> Available
      await axiosClient.patch(`/trips/${completeTarget.id}/complete`, {
        actual_distance: Number(completeForm.actual_distance),
        fuel_consumed: Number(completeForm.fuel_consumed),
      })
      setCompleteTarget(null)
      await loadAll()
    } catch (err) {
      setCompleteError(err.response?.data?.detail || 'Could not complete trip.')
    }
  }

  const handleCancel = async (trip) => {
    if (!confirm(`Cancel trip ${trip.source} → ${trip.destination}? Vehicle and driver will be restored to Available.`)) return
    try {
      await axiosClient.patch(`/trips/${trip.id}/cancel`)
      await loadAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not cancel trip.')
    }
  }

  const columns = [
    { key: 'route', label: 'Route', render: (t) => <span>{t.source} → {t.destination}</span> },
    { key: 'vehicle', label: 'Vehicle', render: (t) => {
        const vehicle = vehicles.find((v) => v.id === t.vehicle_id)
        return vehicle ? `${vehicle.license_plate} — ${vehicle.model}` : '—'
      }
    },
    { key: 'driver', label: 'Driver', render: (t) => drivers.find((d) => d.id === t.driver_id)?.name || '—' },
    { key: 'cargo_weight', label: 'Cargo', sortable: true, render: (t) => `${t.cargo_weight} kg` },
    { key: 'planned_distance', label: 'Planned Dist.', sortable: true, render: (t) => `${t.planned_distance} km` },
    { key: 'status', label: 'Status', sortable: true, render: (t) => <StatusBadge status={t.status} /> },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-rail-bg">Trips</h1>
          <p className="text-sm text-slate-500 mt-1">Draft → Dispatched → Completed / Cancelled.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Trip
        </button>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <DataTable
        columns={columns}
        data={trips}
        searchKeys={['source', 'destination', 'status']}
        emptyMessage={loading ? 'Loading trips…' : 'No trips yet — create one to get started.'}
        actions={(trip) => (
          <>
            {trip.status === TRIP_STATUS.DRAFT && (
              <button onClick={() => handleDispatch(trip)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600" title="Dispatch">
                <Send size={15} />
              </button>
            )}
            {trip.status === TRIP_STATUS.DISPATCHED && (
              <>
                <button onClick={() => openComplete(trip)} className="p-1.5 rounded-md hover:bg-green-50 text-green-600" title="Complete">
                  <CheckCircle2 size={15} />
                </button>
                <button onClick={() => handleCancel(trip)} className="p-1.5 rounded-md hover:bg-red-50 text-red-600" title="Cancel">
                  <XCircle size={15} />
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Create Trip modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">New Trip</h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Source</label>
                  <input required value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Destination</label>
                  <input required value={form.destination} onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="label-field">Vehicle (Available only)</label>
                  <select required value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))} className="input-field">
                    <option value="">Select a vehicle…</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.license_plate} — {v.model} (max {v.max_capacity_kg} kg)</option>
                    ))}
                  </select>
                  {availableVehicles.length === 0 && <p className="text-xs text-amber-600 mt-1">No available vehicles right now.</p>}
                </div>
                <div className="col-span-2">
                  <label className="label-field">Driver (Available, licensed only)</label>
                  <select required value={form.driver_id} onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))} className="input-field">
                    <option value="">Select a driver…</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} — {d.license_category}</option>
                    ))}
                  </select>
                  {availableDrivers.length === 0 && <p className="text-xs text-amber-600 mt-1">No available, licensed drivers right now.</p>}
                </div>
                <div>
                  <label className="label-field">Cargo Weight (kg)</label>
                  <input required type="number" min="0" value={form.cargo_weight} onChange={(e) => setForm((f) => ({ ...f, cargo_weight: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Planned Distance (km)</label>
                  <input required type="number" min="0" value={form.planned_distance} onChange={(e) => setForm((f) => ({ ...f, planned_distance: e.target.value }))} className="input-field" />
                </div>
              </div>

              {formError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create Draft Trip'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip modal */}
      {completeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-semibold text-rail-bg">Complete Trip</h3>
              <button onClick={() => setCompleteTarget(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleComplete} className="p-5 space-y-4">
              <p className="text-sm text-slate-500">{completeTarget.source} → {completeTarget.destination}</p>
              <div>
                <label className="label-field">Actual Distance (km)</label>
                <input required type="number" min="0" value={completeForm.actual_distance} onChange={(e) => setCompleteForm((f) => ({ ...f, actual_distance: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label-field">Fuel Consumed (L)</label>
                <input required type="number" min="0" value={completeForm.fuel_consumed} onChange={(e) => setCompleteForm((f) => ({ ...f, fuel_consumed: e.target.value }))} className="input-field" />
              </div>

              {completeError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{completeError}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCompleteTarget(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Mark Completed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
