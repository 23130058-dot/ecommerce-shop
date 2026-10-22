export default function AdminDataTable({
  columns,
  rows,
  rowKey,
  loading = false,
  error = '',
  emptyMessage = 'Không có dữ liệu phù hợp.',
  page = 0,
  pageCount = 1,
  totalElements = 0,
  size = 10,
  onPageChange,
}) {
  const first = totalElements ? page * size + 1 : 0
  const last = Math.min((page + 1) * size, totalElements)
  const pageNumbers = [...new Set([0, page - 1, page, page + 1, pageCount - 1])]
    .filter((number) => number >= 0 && number < pageCount)
    .sort((left, right) => left - right)

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      {error && <div role="alert" className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead><tr className="bg-gray-50/80 text-[10px] font-bold uppercase tracking-[0.06em] text-gray-500">
            {columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-4 py-3 ${column.className || ''}`}>{column.header}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => <tr key={rowKey(row)} className="align-middle transition hover:bg-gray-50/70">
              {columns.map((column) => <td key={column.key} className={`px-4 py-3.5 text-xs text-gray-700 ${column.cellClassName || ''}`}>
                {column.render ? column.render(row) : row[column.key]}
              </td>)}
            </tr>)}
            {rows.length === 0 && <tr><td colSpan={columns.length} className="px-5 py-12 text-center text-xs text-gray-400">{loading ? 'Đang tải dữ liệu…' : emptyMessage}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-[11px] text-gray-500">Hiển thị {first}–{last} trong {totalElements}</p>
        <div className="flex items-center gap-1" aria-label="Phân trang">
          <button type="button" disabled={page <= 0 || loading} onClick={() => onPageChange?.(page - 1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">Trước</button>
          {pageNumbers.map((number, index) => <span className="contents" key={number}>
            {index > 0 && number - pageNumbers[index - 1] > 1 && <span className="px-1 text-xs text-gray-400">…</span>}
            <button type="button" disabled={loading} onClick={() => onPageChange?.(number)} aria-current={page === number ? 'page' : undefined} className={`size-7 rounded-md text-[11px] font-semibold ${page === number ? 'bg-[#f45116] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{number + 1}</button>
          </span>)}
          <button type="button" disabled={page >= pageCount - 1 || loading} onClick={() => onPageChange?.(page + 1)} className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">Tiếp</button>
        </div>
      </div>
    </section>
  )
}
