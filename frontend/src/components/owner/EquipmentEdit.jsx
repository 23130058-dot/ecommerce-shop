import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categories } from '../../data/products'
import { resolveProductImage } from '../home/productImageMap.js'
import { getOwnerProducts, updateOwnerProduct } from '../../services/ownerApi.js'

const emptyForm = {
    name: '',
    category: 'camera',
    type: '',
    brand: '',
    price: '',
    deposit: '0',
    quantity: '1',
    description: '',
    tags: '',
    status: 'ACTIVE',
}

function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Không đọc được ảnh đã chọn.'))
        reader.readAsDataURL(file)
    })
}

export default function EquipmentEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [imagePreview, setImagePreview] = useState('')
    const [imageData, setImageData] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const isPendingApproval = ['PENDING', 'PENDING_APPROVAL', 'WAITING_APPROVAL']
        .includes(String(product?.status || '').toUpperCase())

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        getOwnerProducts({ signal: controller.signal })
            .then((items) => {
                const current = items.find((item) => String(item.id) === String(id))
                if (!current) {
                    setError('Không tìm thấy thiết bị trong danh sách của bạn.')
                    return
                }
                setProduct(current)
                setForm({
                    name: current.name || '',
                    category: current.category || 'camera',
                    type: current.type || '',
                    brand: current.brand || '',
                    price: String(current.dailyPrice ?? ''),
                    deposit: String(current.depositAmount ?? 0),
                    quantity: String(current.availableQuantity ?? 1),
                    description: current.description || '',
                    tags: Array.isArray(current.tags) ? current.tags.join(', ') : (current.tags || '').replaceAll('|', ', '),
                    status: String(current.status || 'ACTIVE').toUpperCase(),
                })
                setImagePreview(resolveProductImage(current.imageKey))
                setError('')
            })
            .catch((loadError) => {
                if (loadError.name !== 'AbortError') setError(loadError.message)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [id])

    const handleChange = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    }

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setError('Ảnh thiết bị cần có định dạng JPG hoặc PNG.')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Ảnh thiết bị tối đa 5 MB.')
            return
        }
        try {
            const dataUrl = await readAsDataUrl(file)
            setImageData(dataUrl)
            setImagePreview(dataUrl)
            setError('')
        } catch (readError) {
            setError(readError.message)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            await updateOwnerProduct(id, {
                name: form.name.trim(),
                category: form.category,
                type: form.type.trim(),
                brand: form.brand.trim(),
                tags: form.tags,
                dailyPrice: Number(form.price),
                depositAmount: Number(form.deposit || 0),
                quantity: Number(form.quantity),
                description: form.description,
                status: form.status,
                ...(imageData ? { imageUrl: imageData } : {}),
            })
            navigate('/owner/equipment', { state: { success: isPendingApproval ? 'Đã lưu thay đổi. Thiết bị vẫn đang chờ Admin duyệt.' : 'Đã lưu thay đổi thiết bị.' } })
        } catch (saveError) {
            setError(saveError.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500">Đang tải thiết bị…</div>
    }

    if (!product) {
        return (
            <div className="rounded-xl border border-red-200 bg-white p-6">
                <p className="text-sm text-red-700" role="alert">{error || 'Không tìm thấy thiết bị.'}</p>
                <Link className="mt-4 inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700" to="/owner/equipment">Quay lại danh sách thiết bị</Link>
            </div>
        )
    }

    return (
        <div className="bg-[#f7f8fa] p-4 sm:p-6">
            <div className="mb-5 text-sm text-gray-500">Quản lý cho thuê <span className="mx-2">/</span><span className="text-gray-800">Sửa thiết bị</span></div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-[#172033]">Sửa thông tin thiết bị</h1>
                <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin cho {product.name}</p>
            </div>

            {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                            <h2 className="mb-6 text-lg font-semibold text-[#172033]">Thông tin thiết bị</h2>
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    Tên thiết bị
                                    <input autoComplete="off" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="name" onChange={handleChange} required value={form.name} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Danh mục
                                    <select className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="category" onChange={handleChange} value={form.category}>
                                        {categories.map((item) => {
                                            const categoryValue = item.keyword === 'drone' ? 'studio' : item.keyword
                                            return <option key={categoryValue} value={categoryValue}>{item.name}</option>
                                        })}
                                    </select>
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Giá thuê / ngày
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" min="1" name="price" onChange={handleChange} required type="number" value={form.price} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Hãng sản xuất
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="brand" onChange={handleChange} value={form.brand} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Loại thiết bị
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="type" onChange={handleChange} value={form.type} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Tiền đặt cọc
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" min="0" name="deposit" onChange={handleChange} type="number" value={form.deposit} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700">
                                    Số lượng sẵn sàng cho thuê
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" min="1" name="quantity" onChange={handleChange} required type="number" value={form.quantity} />
                                </label>
                                {isPendingApproval ? (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:col-span-2">
                                        <p className="text-sm font-semibold text-amber-800">Đang chờ Admin duyệt</p>
                                        <p className="mt-1 text-xs leading-5 text-amber-700">Bạn có thể sửa thông tin, nhưng chỉ Admin mới có thể đưa thiết bị lên cửa hàng.</p>
                                    </div>
                                ) : (
                                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                                        Trạng thái đăng
                                        <select className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="status" onChange={handleChange} value={form.status}>
                                            <option value="ACTIVE">Đang đăng cho thuê</option>
                                            <option value="INACTIVE">Tạm ẩn</option>
                                        </select>
                                    </label>
                                )}
                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    Thẻ tìm kiếm
                                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="tags" onChange={handleChange} placeholder="Ví dụ: Full-frame, 4K, chống rung" value={form.tags} />
                                </label>
                                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                    Mô tả
                                    <textarea className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm font-normal outline-none focus:border-[#F45116]" name="description" onChange={handleChange} placeholder="Mô tả thiết bị..." rows="6" value={form.description} />
                                </label>
                            </div>
                        </section>
                    </div>

                    <aside>
                        <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                            <h2 className="mb-5 text-lg font-semibold text-[#172033]">Hình ảnh</h2>
                            <label className="flex min-h-[280px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 hover:border-[#F45116]">
                                <img alt={product.name} className="max-h-[250px] max-w-full object-contain" src={imagePreview || resolveProductImage(product.imageKey)} />
                                <input accept="image/png,image/jpeg" className="hidden" onChange={handleImageChange} type="file" />
                            </label>
                            <p className="mt-3 text-center text-xs text-gray-400">Nhấn vào hình để chọn ảnh JPG hoặc PNG, tối đa 5 MB</p>
                        </section>

                        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                            <h2 className="mb-4 text-lg font-semibold text-[#172033]">Thông tin hiện tại</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between gap-3"><span className="text-gray-500">Đánh giá</span><span className="font-medium text-gray-700">★ {product.rating || 'Chưa có'}</span></div>
                                <div className="flex justify-between gap-3"><span className="text-gray-500">Đang được thuê</span><span className="font-medium text-gray-700">{Number(product.currentlyRentedQuantity || 0)} thiết bị</span></div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Link className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50" to="/owner/equipment">Hủy</Link>
                    <button className="rounded-lg bg-[#F45116] px-6 py-3 text-sm font-medium text-white hover:bg-[#d9430e] disabled:cursor-wait disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
                </div>
            </form>
        </div>
    )
}
