import { useMemo, useState } from 'react'
import AdminLayout, { AdminIcon } from '../components/admin/AdminLayout.jsx'

const initialDevices = [
  { id: 'EQP-2409', name: 'Sony Alpha A7 IV Body', owner: 'Camera Rental HCM', category: 'Máy ảnh', price: 850000, submitted: '14/10/2026', status: 'pending', condition: 'Mới 98%', location: 'Quận 1, TP. Hồ Chí Minh', description: 'Máy ảnh full-frame 33MP, quay video 4K 60fps. Bao gồm pin, sạc và dây đeo.', note: 'Thiết bị còn thời hạn bảo hành chính hãng.' },
  { id: 'EQP-2408', name: 'Canon RF 24-70mm f/2.8L', owner: 'Studio Mộc', category: 'Ống kính', price: 420000, submitted: '14/10/2026', status: 'pending', condition: 'Mới 95%', location: 'Bình Thạnh, TP. Hồ Chí Minh', description: 'Ống kính zoom tiêu chuẩn RF, khẩu độ f/2.8, chống rung quang học.', note: 'Ảnh chụp serial cần kiểm tra lại.' },
  { id: 'EQP-2407', name: 'DJI Mavic 3 Pro Fly More', owner: 'Trần Quốc Bảo', category: 'Flycam & Drone', price: 1250000, submitted: '13/10/2026', status: 'pending', condition: 'Mới 96%', location: 'Cầu Giấy, Hà Nội', description: 'Flycam ba camera, gồm điều khiển RC, 3 pin, hub sạc và túi bảo vệ.', note: 'Đã cung cấp hình ảnh phụ kiện đầy đủ.' },
  { id: 'EQP-2406', name: 'Tamron 70-200mm f/2.8 G2', owner: 'Bùi Thanh Tùng', category: 'Ống kính', price: 280000, submitted: '11/10/2026', status: 'rejected', condition: 'Đã qua sử dụng', location: 'Quận 3, TP. Hồ Chí Minh', description: 'Ống kính tele zoom ngàm Sony E, có hood và chân đế tripod.', note: 'Ảnh mặt trước bị mờ, chưa xác nhận được tình trạng kính.' },
  { id: 'EQP-2405', name: 'Blackmagic Pocket Cinema 6K', owner: 'Kho Máy Ảnh Sài Gòn', category: 'Máy ảnh', price: 980000, submitted: '10/10/2026', status: 'pending', condition: 'Mới 93%', location: 'Quận 10, TP. Hồ Chí Minh', description: 'Máy quay cinema 6K, gồm cage, pin, sạc và thẻ nhớ CFast.', note: 'Chờ xác minh giấy tờ sở hữu thiết bị.' },
  { id: 'EQP-2404', name: 'Godox AD600 Pro II', owner: 'Ánh Sáng Studio', category: 'Phụ kiện', price: 310000, submitted: '08/10/2026', status: 'approved', condition: 'Mới 97%', location: 'Tân Bình, TP. Hồ Chí Minh', description: 'Đèn flash studio công suất 600Ws, gồm chóa, pin và túi đựng.', note: 'Hồ sơ đã hợp lệ.' },
]

const tabs = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'all', label: 'Tất cả' },
]

function DeviceStatus({ status }) {
  const variants = {
    pending: ['bg-amber-50 text-amber-700', 'Chờ duyệt'],
    approved: ['bg-emerald-50 text-emerald-700', 'Đã duyệt'],
    rejected: ['bg-rose-50 text-rose-700', 'Từ chối'],
  }
  const [classes, label] = variants[status]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${classes}`}><span className="size-1.5 rounded-full bg-current" />{label}</span>
}

function DeviceDetails({ device, onClose, onApprove, onReject }) {
  if (!device) return null
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section role="dialog" aria-modal="true" aria-labelledby="device-detail-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-wider text-[#f45116]">Hồ sơ thiết bị · {device.id}</p><h2 id="device-detail-title" className="mt-1 text-lg font-bold text-gray-900">{device.name}</h2></div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><AdminIcon name="close" /></button>
          </div>
          <div className="mt-5 flex min-h-36 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300"><div className="text-center"><AdminIcon name="camera" className="mx-auto size-10" /><p className="mt-2 text-[10px]">Ảnh thiết bị sẽ hiển thị khi kết nối API</p></div></div>
          <dl className="mt-4 grid grid-cols-[125px_1fr] gap-x-4 gap-y-3 rounded-xl bg-gray-50 p-4 text-xs">
            <dt className="text-gray-500">Chủ sở hữu</dt><dd className="font-medium text-gray-800">{device.owner}</dd>
            <dt className="text-gray-500">Danh mục</dt><dd className="font-medium text-gray-800">{device.category}</dd>
            <dt className="text-gray-500">Giá thuê/ngày</dt><dd className="font-semibold text-[#e94b0a]">{device.price.toLocaleString('vi-VN')}đ</dd>
            <dt className="text-gray-500">Tình trạng</dt><dd className="font-medium text-gray-800">{device.condition}</dd>
            <dt className="text-gray-500">Khu vực</dt><dd className="font-medium text-gray-800">{device.location}</dd>
            <dt className="text-gray-500">Ngày gửi</dt><dd className="font-medium text-gray-800">{device.submitted}</dd>
            <dt className="text-gray-500">Mô tả</dt><dd className="leading-5 text-gray-700">{device.description}</dd>
            <dt className="text-gray-500">Ghi chú kiểm duyệt</dt><dd className="leading-5 text-gray-700">{device.note}</dd>
            <dt className="text-gray-500">Trạng thái</dt><dd><DeviceStatus status={device.status} /></dd>
          </dl>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Đóng</button>
            {device.status === 'pending' && <><button type="button" onClick={() => onReject(device.id)} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Từ chối</button><button type="button" onClick={() => onApprove(device.id)} className="rounded-lg bg-[#f45116] px-4 py-2 text-xs font-semibold text-white hover:bg-[#df4610]">Duyệt thiết bị</button></>}
          </div>
        </section>
      </div>
  )
}

function exportDevicesCsv(devices) {
  const rows = [['Mã thiết bị', 'Tên thiết bị', 'Chủ sở hữu', 'Danh mục', 'Giá thuê/ngày', 'Ngày gửi', 'Trạng thái'], ...devices.map((device) => [device.id, device.name, device.owner, device.category, device.price, device.submitted, device.status])]
  const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'lensrent-thiet-bi-kiem-duyet.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState(initialDevices)
  const [activeTab, setActiveTab] = useState('pending')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [toast, setToast] = useState('')

  const filteredDevices = useMemo(() => devices.filter((device) => {
    const matchesTab = activeTab === 'all' || device.status === activeTab
    const matchesCategory = category === 'all' || device.category === category
    const matchesQuery = `${device.id} ${device.name} ${device.owner}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))
    return matchesTab && matchesCategory && matchesQuery
  }), [devices, activeTab, category, query])

  const counts = useMemo(() => ({
    pending: devices.filter((device) => device.status === 'pending').length,
    approved: devices.filter((device) => device.status === 'approved').length,
    rejected: devices.filter((device) => device.status === 'rejected').length,
  }), [devices])

  const updateStatus = (deviceId, status) => {
    const chosen = devices.find((device) => device.id === deviceId)
    if (status === 'rejected' && chosen?.status === 'pending' && !window.confirm(`Từ chối duyệt thiết bị “${chosen.name}”?`)) return
    setDevices((current) => current.map((device) => device.id === deviceId ? { ...device, status } : device))
    setSelectedDevice((current) => current?.id === deviceId ? { ...current, status } : current)
    const message = status === 'approved' ? `Đã duyệt ${chosen?.name}.` : `Đã từ chối ${chosen?.name}.`
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  return (
      <AdminLayout>
        <main className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[22px] font-bold tracking-tight text-[#1f2937] sm:text-[24px]">Duyệt thiết bị</h1><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">DỮ LIỆU MẪU</span></div><p className="mt-1 text-[11px] leading-5 text-gray-500 sm:text-xs">Kiểm tra thông tin thiết bị do Owner đăng trước khi hiển thị trên LensRent.</p></div>
            <button type="button" onClick={() => exportDevicesCsv(filteredDevices)} className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-[#f45116] px-3.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#df4610]"><AdminIcon name="download" className="size-3.5" />Xuất danh sách</button>
          </div>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Tổng quan kiểm duyệt thiết bị">
            <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">CHỜ DUYỆT</p><p className="mt-2 text-2xl font-bold text-gray-800">{counts.pending}</p><p className="mt-1 text-[10px] text-amber-600">Thiết bị cần kiểm tra</p></article>
            <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">ĐÃ DUYỆT</p><p className="mt-2 text-2xl font-bold text-gray-800">{counts.approved}</p><p className="mt-1 text-[10px] text-emerald-600">Đang hiển thị trên nền tảng</p></article>
            <article className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-bold tracking-wide text-gray-500">TỪ CHỐI</p><p className="mt-2 text-2xl font-bold text-gray-800">{counts.rejected}</p><p className="mt-1 text-[10px] text-gray-400">Cần Owner bổ sung thông tin</p></article>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div><h2 className="text-[13px] font-bold text-gray-800">Danh sách thiết bị gửi duyệt</h2><p className="mt-1 text-[10px] text-gray-400">Mở chi tiết để xem mô tả và ghi chú kiểm duyệt</p></div>
              <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 text-gray-400 focus-within:border-orange-400 sm:max-w-[290px]"><AdminIcon name="search" className="size-4 shrink-0" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thiết bị hoặc Owner..." aria-label="Tìm thiết bị" className="min-w-0 flex-1 bg-transparent text-[11px] text-gray-700 outline-none placeholder:text-gray-400" /></label>
            </div>
            <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Lọc theo trạng thái kiểm duyệt">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold ${activeTab === tab.value ? 'bg-orange-50 text-[#e94b0a]' : 'text-gray-500 hover:bg-gray-50'}`}>{tab.label}{tab.value !== 'all' && <span className={`ml-1.5 ${activeTab === tab.value ? 'text-[#e94b0a]/70' : 'text-gray-400'}`}>{counts[tab.value]}</span>}</button>)}</div>
              <label className="flex items-center gap-2 text-[10px] text-gray-500"><AdminIcon name="filter" className="size-3.5" /><span>Danh mục</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[10px] text-gray-700 outline-none focus:border-orange-400"><option value="all">Tất cả danh mục</option><option>Máy ảnh</option><option>Ống kính</option><option>Flycam & Drone</option><option>Phụ kiện</option></select></label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead><tr className="bg-gray-50/80 text-[9px] font-bold uppercase tracking-[0.06em] text-gray-500"><th className="px-5 py-3">Thiết bị</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Giá thuê/ngày</th><th className="px-4 py-3">Ngày gửi</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                {filteredDevices.map((device) => <tr key={device.id} className="transition hover:bg-gray-50/70">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f45116]"><AdminIcon name={device.category === 'Ống kính' ? 'camera' : device.category === 'Phụ kiện' ? 'box' : 'camera'} className="size-[18px]" /></span><div className="min-w-0"><p className="text-[11px] font-semibold text-gray-800">{device.name}</p><p className="mt-0.5 text-[10px] text-gray-400">{device.owner}</p><p className="mt-0.5 text-[9px] text-gray-300">{device.id}</p></div></div></td>
                  <td className="px-4 py-3.5 text-[10px] text-gray-600">{device.category}</td><td className="px-4 py-3.5 text-[10px] font-semibold text-gray-700">{device.price.toLocaleString('vi-VN')}đ</td><td className="px-4 py-3.5 text-[10px] text-gray-600">{device.submitted}</td><td className="px-4 py-3.5"><DeviceStatus status={device.status} /></td>
                  <td className="px-4 py-3.5"><div className="flex items-center justify-end gap-1.5"><button type="button" onClick={() => setSelectedDevice(device)} className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"><AdminIcon name="eye" className="size-3.5" />Chi tiết</button>{device.status === 'pending' && <><button type="button" onClick={() => updateStatus(device.id, 'rejected')} className="rounded-md border border-rose-100 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50">Từ chối</button><button type="button" onClick={() => updateStatus(device.id, 'approved')} className="rounded-md bg-[#f45116] px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#df4610]">Duyệt</button></>}</div></td>
                </tr>)}
                {filteredDevices.length === 0 && <tr><td colSpan="6" className="px-5 py-12 text-center text-xs text-gray-400">Không tìm thấy thiết bị phù hợp.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"><p className="text-[10px] text-gray-500">Hiển thị {filteredDevices.length} thiết bị trong danh sách</p><div className="flex items-center gap-1"><button type="button" disabled className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] text-gray-400">Trước</button><button type="button" aria-current="page" className="size-7 rounded-md bg-[#f45116] text-[10px] font-semibold text-white">1</button><button type="button" disabled className="rounded-md border border-gray-200 px-2.5 py-1.5 text-[10px] text-gray-400">Tiếp</button></div></div>
          </section>
          <p className="mb-1 mt-4 text-center text-[10px] text-gray-400">Bản xem trước giao diện · dữ liệu thiết bị hiện đang là dữ liệu mẫu.</p>
        </main>
        {toast && <div role="status" className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-xs font-medium text-white shadow-lg"><AdminIcon name="check" className="size-4 text-emerald-400" />{toast}</div>}
        <DeviceDetails device={selectedDevice} onClose={() => setSelectedDevice(null)} onApprove={(id) => updateStatus(id, 'approved')} onReject={(id) => updateStatus(id, 'rejected')} />
      </AdminLayout>
  )
}