import { useEffect, useMemo, useState } from 'react'
import DataTable from '../shared/DataTable.jsx'
import { getOwnerBookings } from '../../services/ownerApi.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`
const date = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN') : '—'
const statusNames = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', ACTIVE: 'Đang thuê', IN_PROGRESS: 'Đang thuê', RENTING: 'Đang thuê', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã hủy', CANCELED: 'Đã hủy' }

export default function RentalHistory() {
  const [bookings, setBookings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getOwnerBookings({ signal: controller.signal })
      .then((rows) => setBookings(Array.isArray(rows) ? rows : []))
      .catch((requestError) => { if (requestError.name !== 'AbortError') setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  const filteredBookings = useMemo(() => statusFilter === 'all'
    ? bookings
    : bookings.filter((booking) => statusFilter === 'renting'
      ? ['CONFIRMED', 'ACTIVE', 'IN_PROGRESS', 'RENTING'].includes(String(booking.status).toUpperCase())
      : String(booking.status).toUpperCase() === statusFilter.toUpperCase()), [bookings, statusFilter])

  const columns = [
    { key: 'rentalCode', header: 'Mã đơn', className: 'whitespace-nowrap', render: (item) => <span className="font-semibold text-[#172033]">#{item.rentalCode || item.rentalId}</span> },
    { key: 'productNames', header: 'Thiết bị', className: 'min-w-[220px]' },
    { key: 'renterName', header: 'Người thuê', render: (item) => <><p className="font-medium text-gray-700">{item.renterName}</p><p className="mt-1 text-[10px] text-gray-400">{item.renterPhone || '—'}</p></> },
    { key: 'startDate', header: 'Thời gian thuê', className: 'whitespace-nowrap', render: (item) => <>{date(item.startDate)}<span className="mx-1 text-gray-400">–</span>{date(item.endDate)}</> },
    { key: 'rentalAmount', header: 'Tổng tiền', className: 'whitespace-nowrap', render: (item) => <span className="font-bold text-[#f45116]">{money(Number(item.rentalAmount || 0) + Number(item.depositAmount || 0))}</span> },
    { key: 'status', header: 'Trạng thái', render: (item) => <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">{statusNames[item.status] || item.status}</span> },
  ]

  return <main className="px-2 py-3 sm:px-4">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs text-gray-400">Quản lý cho thuê / Lịch sử thuê</p><h1 className="text-2xl font-bold text-gray-800">Lịch sử cho thuê</h1><p className="mt-1 text-sm text-gray-500">Theo dõi các đơn đặt thiết bị của bạn.</p></div></div>
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"><label className="text-xs font-medium text-gray-600" htmlFor="owner-rental-status">Trạng thái</label><select id="owner-rental-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả trạng thái</option><option value="PENDING">Chờ xác nhận</option><option value="renting">Đang thuê</option><option value="COMPLETED">Đã hoàn tất</option><option value="CANCELLED">Đã hủy</option></select><span className="ml-auto text-xs text-gray-500">{filteredBookings.length} đơn</span></div>
    <DataTable columns={columns} rows={filteredBookings} rowKey={(item) => item.rentalId} loading={loading} error={error} searchable searchPlaceholder="Tìm mã đơn, thiết bị, người thuê…" emptyMessage="Không tìm thấy lịch sử cho thuê." pageSize={10} />
  </main>
}
