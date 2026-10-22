import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../shared/DataTable.jsx'
import { getOwnerTransactions } from '../../services/ownerApi.js'

const money = (value) => `${Number(value || 0) > 0 ? '+' : ''}${Number(value || 0).toLocaleString('vi-VN')} đ`
const time = (value) => value ? new Date(value).toLocaleString('vi-VN') : '—'

export default function TransactionHistory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getOwnerTransactions({ signal: controller.signal })
      .then((rows) => setItems(Array.isArray(rows) ? rows : []))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const columns = [
    { key: 'title', header: 'Nội dung', className: 'min-w-[220px]', render: (row) => <><p className="font-semibold text-gray-800">{row.title}</p><p className="mt-1 text-[10px] text-gray-500">{row.subtitle}</p></> },
    { key: 'createdAt', header: 'Thời gian', className: 'whitespace-nowrap', render: (row) => time(row.createdAt) },
    { key: 'type', header: 'Loại', render: (row) => row.type === 'WITHDRAWAL' ? 'Rút tiền' : 'Thuê thiết bị' },
    { key: 'amount', header: 'Số tiền', className: 'whitespace-nowrap', render: (row) => <span className={`font-bold ${Number(row.amount) >= 0 ? 'text-emerald-600' : 'text-gray-700'}`}>{money(row.amount)}</span> },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${row.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{row.status === 'PENDING' ? 'Chờ xử lý' : 'Hoàn tất'}</span> },
  ]

  return <main className="px-2 py-3 sm:px-4">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-800">Lịch sử giao dịch</h1><p className="mt-1 text-sm text-gray-500">Thu nhập từ đơn đã thanh toán và các yêu cầu rút tiền.</p></div><Link to="/owner/wallet" className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-semibold text-white">Ví Owner</Link></div>
    <DataTable columns={columns} rows={items} rowKey={(row) => `${row.type}-${row.id}`} loading={loading} error={error} searchable searchPlaceholder="Tìm giao dịch…" emptyMessage="Chưa có giao dịch." pageSize={10} />
  </main>
}
