import { STATUS_STYLES } from '../utils/constants'

// Renders a small colored pill for any status enum value (Vehicle, Driver, Trip, Maintenance).
// Falls back to slate styling so an unrecognized string never throws or looks broken.
export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || {
    dot: 'bg-slate-400',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    ring: 'ring-slate-200',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${style.bg} ${style.text} ${style.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  )
}
