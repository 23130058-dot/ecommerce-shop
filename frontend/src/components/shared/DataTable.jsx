import { useMemo, useState } from 'react'

function compareValues(left, right) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), 'vi', { numeric: true, sensitivity: 'base' })
}

export default function DataTable({
  columns,
  rows = [],
  rowKey,
  loading = false,
  error = '',
  emptyMessage = 'Không có dữ liệu phù hợp.',
  searchable = false,
  searchPlaceholder = 'Tìm trong bảng…',
  page,
  pageCount,
  totalElements,
  size = 10,
  onPageChange,
  pageSize = 10,
  pagination = true,
}) {
  const [query, setQuery] = useState('')
  const [localPage, setLocalPage] = useState(0)
  const [sort, setSort] = useState({ key: '', direction: 'asc' })
  const serverPaged = typeof onPageChange === 'function'
  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    const matches = searchable && normalized
      ? rows.filter((row) => columns.some((column) => {
          if (column.searchable === false) return false
          const value = column.searchValue ? column.searchValue(row) : row[column.key]
          return String(value ?? '').toLocaleLowerCase('vi').includes(normalized)
        }))
      : rows

    if (!sort.key) return matches
    const column = columns.find((item) => item.key === sort.key)
    if (!column) return matches
    return [...matches].sort((left, right) => {
      const leftValue = column.sortValue ? column.sortValue(left) : left[column.key]
      const rightValue = column.sortValue ? column.sortValue(right) : right[column.key]
      return compareValues(leftValue, rightValue) * (sort.direction === 'asc' ? 1 : -1)
    })
  }, [columns, query, rows, searchable, sort])

  const activePage = serverPaged ? (page || 0) : localPage
  const activeSize = serverPaged ? size : pageSize
  const activePageCount = serverPaged
    ? Math.max(pageCount || 1, 1)
    : Math.max(Math.ceil(filteredRows.length / activeSize), 1)
  const activeTotal = serverPaged ? (totalElements ?? rows.length) : filteredRows.length
  const visibleRows = serverPaged || !pagination
    ? filteredRows
    : filteredRows.slice(activePage * activeSize, (activePage + 1) * activeSize)
  const first = activeTotal ? activePage * activeSize + 1 : 0
  const last = activeTotal ? Math.min((activePage + 1) * activeSize, activeTotal) : 0

  const changePage = (nextPage) => {
    if (serverPaged) onPageChange(nextPage)
    else setLocalPage(nextPage)
  }

  const toggleSort = (column) => {
    if (column.sortable === false) return
    setSort((current) => ({ key: column.key, direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc' }))
    setLocalPage(0)
  }

  const pageNumbers = [...new Set([0, activePage - 1, activePage, activePage + 1, activePageCount - 1])]
    .filter((number) => number >= 0 && number < activePageCount)
    .sort((left, right) => left - right)

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      {searchable && <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-gray-500">{activeTotal.toLocaleString('vi-VN')} dòng dữ liệu</p>
        <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-xs">
          <span aria-hidden="true" className="text-sm">⌕</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setLocalPage(0) }} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" />
        </label>
      </div>}
      {error && <div role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead><tr className="bg-gray-50/80 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-500">
            {columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.className || ''}`}>
              <button type="button" disabled={column.sortable === false} onClick={() => toggleSort(column)} className={`inline-flex items-center gap-1 text-left ${column.sortable === false ? 'cursor-default' : 'hover:text-gray-800'}`}>
                {column.header}{column.sortable !== false && <span aria-hidden="true" className="text-[9px] text-gray-400">{sort.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}</span>}
              </button>
            </th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {visibleRows.map((row, index) => <tr key={rowKey ? rowKey(row) : index} className="align-middle transition hover:bg-gray-50/70">
              {columns.map((column) => <td key={column.key} className={`px-4 py-3.5 text-xs text-gray-700 ${column.cellClassName || ''}`}>
                {column.render ? column.render(row) : row[column.key]}
              </td>)}
            </tr>)}
            {visibleRows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-xs text-gray-400">{loading ? 'Đang tải dữ liệu…' : emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      {pagination && <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-[11px] text-gray-500">Hiển thị {first}–{last} trong {activeTotal}</p>
        <div className="flex items-center gap-1" aria-label="Phân trang">
          <button type="button" disabled={activePage <= 0 || loading} onClick={() => changePage(activePage - 1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
          {pageNumbers.map((number, index) => <span className="contents" key={number}>
            {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="px-1 text-xs text-gray-400">…</span>}
            <button type="button" disabled={loading} onClick={() => changePage(number)} aria-current={activePage === number ? 'page' : undefined} className={`size-7 rounded-md text-[11px] font-semibold ${activePage === number ? 'bg-[#f45116] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{number + 1}</button>
          </span>)}
          <button type="button" disabled={activePage >= activePageCount - 1 || loading} onClick={() => changePage(activePage + 1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">Tiếp</button>
        </div>
      </div>}
    </section>
  )
}
