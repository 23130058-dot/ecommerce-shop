import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOwnerProducts } from '../../services/ownerApi.js'
import { resolveProductImage } from '../home/productImageMap.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`
const pendingStatuses = ['PENDING', 'PENDING_APPROVAL', 'WAITING_APPROVAL']
const categoryLabels = { camera: 'Máy ảnh', lens: 'Ống kính', accessory: 'Phụ kiện', studio: 'Thiết bị Studio' }

function statusInfo(product) {
    const normalized = String(product.status || '').toUpperCase()
    if (pendingStatuses.includes(normalized)) return { label: 'Chờ Admin duyệt', classes: 'bg-amber-50 text-amber-700' }
    if (normalized === 'INACTIVE') return { label: 'Tạm ẩn', classes: 'bg-gray-100 text-gray-600' }
    if (Number(product.currentlyRentedQuantity) > 0) return { label: 'Đang thuê', classes: 'bg-blue-50 text-blue-700' }
    if (normalized === 'ACTIVE') return { label: 'Đang hiển thị', classes: 'bg-emerald-50 text-emerald-700' }
    return { label: normalized || 'Chưa rõ', classes: 'bg-gray-100 text-gray-600' }
}

export default function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        getOwnerProducts({ signal: controller.signal })
            .then((items) => {
                const match = (Array.isArray(items) ? items : []).find((item) => String(item.id) === String(id))
                setProduct(match || null)
            })
            .catch((loadError) => {
                if (loadError.name !== 'AbortError') setError(loadError.message)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [id])

    const tags = useMemo(() => {
        if (Array.isArray(product?.tags)) return product.tags
        return String(product?.tags || '').split('|').map((tag) => tag.trim()).filter(Boolean)
    }, [product?.tags])

    if (loading) {
        return <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Đang tải thông tin thiết bị…</div>
    }

    if (error || !product) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center sm:p-10">
                <h1 className="text-xl font-bold text-gray-800">{error ? 'Không tải được sản phẩm' : 'Không tìm thấy sản phẩm'}</h1>
                <p className="mt-2 text-sm text-gray-500">{error || 'Thiết bị này không thuộc danh sách sản phẩm của tài khoản Owner hiện tại.'}</p>
                <Link to="/owner/equipment" className="mt-6 inline-flex rounded-lg bg-[#F45116] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d9440d]">Quay lại quản lý thiết bị</Link>
            </div>
        )
    }

    const currentStatus = statusInfo(product)
    const image = resolveProductImage(product.imageKey)
    const categoryName = product.categoryName || categoryLabels[String(product.category || '').toLowerCase()] || 'Khác'

    return (
        <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <Link to="/owner/equipment" className="hover:text-[#F45116]">Quản lý thiết bị</Link>
                <span>/</span>
                <span className="max-w-[60vw] truncate text-gray-800">{product.name}</span>
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-[#172033] sm:text-3xl">Chi tiết thiết bị</h1>
                    <p className="mt-1 text-sm text-gray-500">Thông tin được tải trực tiếp từ sản phẩm bạn đã đăng.</p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <Link to="/owner/equipment" className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Quay lại</Link>
                    <Link to={`/owner/equipment/${product.id}/edit`} className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d9440d]">Chỉnh sửa</Link>
                </div>
            </div>

            <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
                    <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 p-4 sm:h-80">
                        <img src={image} alt={product.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <span className="text-sm font-medium text-gray-500">Trạng thái</span>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${currentStatus.classes}`}>{currentStatus.label}</span>
                    </div>
                </section>

                <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#F45116]">{product.type || product.brand || 'Thiết bị cho thuê'}</p>
                    <h2 className="mt-2 break-words text-2xl font-bold text-gray-900">{product.name}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600">{categoryName}</span>
                        {product.brand && <span className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600">{product.brand}</span>}
                        {product.rating != null && <span className="text-sm text-gray-600"><span className="text-amber-500">★</span> <strong className="text-gray-800">{Number(product.rating).toLocaleString('vi-VN')}</strong> / 5</span>}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-orange-50 p-4 sm:col-span-2">
                            <p className="text-xs text-gray-500">Giá thuê / ngày</p>
                            <p className="mt-1 whitespace-nowrap text-2xl font-extrabold text-[#F45116]">{money(product.dailyPrice)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Tiền đặt cọc</p><p className="mt-1 font-bold text-gray-800">{money(product.depositAmount)}</p></div>
                        <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Mã thiết bị</p><p className="mt-1 font-bold text-gray-800">LR-{String(product.id).padStart(4, '0')}</p></div>
                        <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Số lượng đang đăng</p><p className="mt-1 font-bold text-gray-800">{Number(product.availableQuantity || 0)}</p></div>
                        <div className="rounded-lg bg-gray-50 p-4"><p className="text-xs text-gray-500">Số lượng đang thuê / đặt</p><p className="mt-1 font-bold text-gray-800">{Number(product.currentlyRentedQuantity || 0)}</p></div>
                    </div>

                    {tags.length > 0 && <div className="mt-6 border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-semibold text-gray-800">Đặc điểm nổi bật</h3>
                        <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{tag}</span>)}</div>
                    </div>}
                </section>
            </div>

            <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <h3 className="text-base font-bold text-gray-900">Mô tả thiết bị</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">{product.description?.trim() || 'Chưa có mô tả cho thiết bị này.'}</p>
            </section>

            <section className="mt-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <h3 className="text-base font-bold text-gray-900">Quản lý sản phẩm</h3>
                <p className="mt-2 text-sm leading-6 text-gray-500">Thiết bị thuộc tài khoản Owner hiện tại. Bạn có thể cập nhật thông tin hoặc theo dõi lịch thuê trong workspace.</p>
                <div className="mt-4 flex flex-wrap gap-4">
                    <Link to="/owner/rental-history" className="text-sm font-semibold text-[#F45116] hover:underline">Xem lịch sử thuê →</Link>
                    <Link to="/owner/schedule-settings" className="text-sm font-semibold text-[#F45116] hover:underline">Thiết lập lịch & giá →</Link>
                </div>
            </section>
        </div>
    )
}