import { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable table with client-side search, column sort, and pagination.
 * Used across Vehicles / Drivers / Trips / Maintenance pages.
 *
 * columns: [{ key, label, render?: (row) => node, sortable?: bool, sortAccessor?: (row) => value }]
 * data: array of row objects (must have a stable `id` field)
 * searchKeys: which row fields free-text search matches against
 * actions: (row) => node — rendered in a trailing "Actions" column
 * emptyMessage: shown when data is empty (post-filter)
 */
export default function DataTable({
  columns,
  data,
  searchKeys = [],
  actions,
  emptyMessage = 'No records found.',
  pageSize = 8,
  toolbar,
}) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!query.trim() || searchKeys.length === 0) return data
    const q = query.trim().toLowerCase()
    return data.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
    )
  }, [data, query, searchKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    const accessor = col?.sortAccessor || ((row) => row[sortKey])
    const copy = [...filtered]
    copy.sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return av - bv
      return String(av).localeCompare(String(bv))
    })
    if (sortDir === 'desc') copy.reverse()
    return copy
  }, [filtered, sortKey, sortDir, columns])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir('asc')
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between px-4 py-3 border-b border-slate-200">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search…"
              className="input-field pl-9"
            />
          </div>
        )}
        {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-10 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 align-middle whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 hover:bg-slate-100"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-slate-200 disabled:opacity-30 hover:bg-slate-100"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
