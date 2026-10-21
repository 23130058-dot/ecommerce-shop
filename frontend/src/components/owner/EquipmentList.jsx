import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categories } from '../../data/products'
import { resolveProductImage } from '../home/productImageMap.js'
import { getOwnerProducts } from '../../services/ownerApi.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export default function EquipmentList() {
    const location = useLocation()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [status, setStatus] = useState('all')
    const [equipment, setEquipment] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        getOwnerProducts({ signal: controller.signal })
            .then((items) => setEquipment(Array.isArray(items) ? items : []))
            .catch((loadError) => { if (loadError.name !== 'AbortError') setError(loadError.message) })
            .finally(() => { if (!controller.signal.aborted) setLoading(false) })
        return () => controller.abort()
    }, [])

    const filteredEquipment = useMemo(() => {
        const keyword = search.toLocaleLowerCase('vi').trim()
        return equipment.filter((item) => {
            const categorySlug = category === 'all' ? '' : category === 'drone' ? 'studio' : category
            const matchSearch = `${item.name || ''} ${item.type || ''} ${item.brand || ''}`.toLocaleLowerCase('vi').includes(keyword)
            const matchCategory = !categorySlug || item.category === categorySlug
            const available = Number(item.availableQuantity || 0)
            const rented = Number(item.currentlyRentedQuantity || 0)
            const matchStatus = status === 'all'
                || (status === 'available' && item.status === 'ACTIVE' && available > 0)
                || (status === 'rented' && rented > 0)
                || (status === 'hidden' && item.status !== 'ACTIVE')
            return matchSearch && matchCategory && matchStatus
        })
    }, [category, equipment, search, status])

    const availableCount = equipment.reduce((sum, item) => sum + Number(item.availableQuantity || 0), 0)
    const rentedCount = equipment.reduce((sum, item) => sum + Number(item.currentlyRentedQuantity || 0), 0)

    return (
        <div className="min-h-screen bg-[#f7f8fa] p-6">
            <div className="mb-5 text-sm text-gray-500">Quản lý cho thuê <span className="mx-2">/</span><span className="text-gray-800">Quản lý thiết bị</span></div>

            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-[#172033]">Quản lý thiết bị</h1>
                    <p className="mt-1 text-sm text-gray-500">Theo dõi thiết bị đã đăng, số lượng còn và thiết bị đang được thuê.</p>
                    {location.state?.success && <p className="mt-2 text-sm font-semibold text-emerald-600" role="status">{location.state.success}</p>}
                </div>
                <Link to="/owner/equipment/add" className="inline-flex items-center justify-center rounded-lg bg-[#F45116] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#d9430e]"><span className="mr-2 text-lg">+</span>Thêm thiết bị</Link>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Thiết bị đã đăng</p><p className="mt-2 text-2xl font-semibold text-[#172033]">{equipment.length}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Số lượng sẵn sàng</p><p className="mt-2 text-2xl font-semibold text-green-600">{availableCount}</p></div>
                <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Đã đặt / đang thuê</p><p className="mt-2 text-2xl font-semibold text-blue-600">{rentedCount}</p></div>
            </div>

            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm thiết bị của bạn..." className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]" />
                    <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"><option value="all">Tất cả danh mục</option>{categories.map((item) => <option key={item.keyword} value={item.keyword}>{item.name}</option>)}</select>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"><option value="all">Tất cả trạng thái</option><option value="available">Còn thiết bị</option><option value="rented">Đang có đơn thuê</option><option value="hidden">Tạm ẩn</option></select>
                </div>
            </div>

            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {loading ? <div className="px-5 py-12 text-center text-sm text-gray-500">Đang tải thiết bị…</div> : <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px]">
                        <thead><tr className="border-b border-gray-200 bg-gray-50">{['Thiết bị', 'Danh mục', 'Giá thuê', 'Số lượng', 'Trạng thái', 'Thao tác'].map((label) => <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500" key={label}>{label}</th>)}</tr></thead>
                        <tbody>
                        {filteredEquipment.map((item) => {
                            const available = Number(item.availableQuantity || 0)
                            const rented = Number(item.currentlyRentedQuantity || 0)
                            const isActive = item.status === 'ACTIVE'
                            return <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <td className="px-5 py-4"><div className="flex items-center gap-4"><div className="flex h-16 w-20 items-center justify-center rounded-lg bg-gray-50"><img src={resolveProductImage(item.imageKey)} alt={item.name} className="h-full w-full rounded-lg object-contain" /></div><div><p className="font-medium text-[#172033]">{item.name}</p><p className="mt-1 text-xs text-gray-500">{item.brand ? `${item.brand} · ` : ''}{item.type}</p></div></div></td>
                                <td className="px-5 py-4 text-sm text-gray-600">{item.categoryName || 'Khác'}</td>
                                <td className="px-5 py-4"><p className="text-sm font-medium text-[#172033]">{money(item.dailyPrice)}</p><p className="text-xs text-gray-400">/ ngày</p></td>
                                <td className="px-5 py-4 text-sm"><span className="font-semibold text-green-700">Còn {available}</span><span className="ml-2 text-gray-500">· thuê {rented}</span></td>
                                <td className="px-5 py-4">{!isActive ? <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Tạm ẩn</span> : rented > 0 ? <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">Đang thuê / đã đặt</span> : <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">Sẵn sàng</span>}</td>
                                <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/owner/equipment/${item.id}/edit`} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#F45116] hover:text-[#F45116]">Sửa</Link><Link to={`/owner/product/${item.id}`} className="rounded-lg border border-[#F45116] px-3 py-2 text-xs font-medium text-[#F45116] hover:bg-orange-50">Chi tiết</Link></div></td>
                            </tr>
                        })}
                        </tbody>
                    </table>
                </div>}
                {!loading && !error && filteredEquipment.length === 0 && <div className="py-12 text-center text-sm text-gray-500">{equipment.length ? 'Không tìm thấy thiết bị phù hợp.' : 'Bạn chưa đăng thiết bị nào. Chọn “Thêm thiết bị” để tạo tin cho thuê đầu tiên.'}</div>}
            </div>
        </div>
    )
}