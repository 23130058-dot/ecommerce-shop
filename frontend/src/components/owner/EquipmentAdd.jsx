import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories } from '../../data/products'
import { createOwnerProduct } from '../../services/ownerApi.js'

function readImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Không đọc được ảnh đã chọn.'))
        reader.readAsDataURL(file)
    })
}

export default function EquipmentAdd() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: '',
        category: '',
        type: '',
        brand: '',
        tags: '',
        price: '',
        deposit: '',
        quantity: '1',
        description: '',
    })

    const [image, setImage] = useState(null)
    const [imageData, setImageData] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]

        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            setError('Ảnh tối đa 5 MB.')
            e.target.value = ''
            return
        }
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
            setError('Vui lòng chọn ảnh PNG, JPG hoặc WebP.')
            e.target.value = ''
            return
        }
        setError('')
        setImage(URL.createObjectURL(file))
        try {
            setImageData(await readImage(file))
        } catch (readError) {
            setError(readError.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            await createOwnerProduct({
                name: form.name.trim(),
                category: form.category,
                type: form.type.trim(),
                brand: form.brand.trim(),
                tags: form.tags.trim(),
                dailyPrice: Number(form.price),
                depositAmount: Number(form.deposit || 0),
                quantity: Number(form.quantity),
                description: form.description.trim(),
                imageUrl: imageData,
            })
            navigate('/owner/equipment', { state: { success: 'Đã gửi thiết bị để Admin xét duyệt. Thiết bị sẽ hiển thị cho renter sau khi được duyệt.' } })
        } catch (saveError) {
            setError(saveError.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="bg-[#f7f8fa] p-6">

            {/* Breadcrumb */}
            <div className="mb-5 text-sm text-gray-500">

                Quản lý cho thuê

                <span className="mx-2">
          /
        </span>

                <span className="text-gray-800">
          Thêm thiết bị
        </span>

            </div>

            {/* Header */}
            <div className="mb-6">

                <h1 className="text-2xl font-semibold text-[#172033]">
                    Thêm thiết bị
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Gửi thiết bị mới để Admin xét duyệt
                </p>

            </div>

            <form onSubmit={handleSubmit}>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                    {/* Information */}
                    <div className="xl:col-span-2">

                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <h2 className="mb-6 text-lg font-semibold text-[#172033]">
                                Thông tin thiết bị
                            </h2>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                {/* Name */}
                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Tên thiết bị
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        placeholder="VD: Sony Alpha A7R V"
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    />

                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Loại thiết bị</label>
                                    <input name="type" value={form.type} onChange={handleChange} placeholder="VD: MIRRORLESS CAMERA" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]" />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Thương hiệu</label>
                                    <input name="brand" value={form.brand} onChange={handleChange} placeholder="VD: Sony" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]" />
                                </div>

                                {/* Category */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Danh mục
                                    </label>

                                    <select
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    >

                                        <option value="">
                                            Chọn danh mục
                                        </option>

                                        {categories.map((item) => (

                                            <option
                                                key={item.keyword}
                                                value={item.keyword === 'drone' ? 'studio' : item.keyword}
                                            >
                                                {item.name}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Số lượng thiết bị</label>
                                    <input type="number" name="quantity" value={form.quantity} onChange={handleChange} min="1" step="1" required className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]" />
                                </div>

                                {/* Price */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Giá thuê / ngày
                                    </label>

                                    <div className="relative">

                                        <input
                                            type="number"
                                            name="price"
                                            value={form.price}
                                            onChange={handleChange}
                                            placeholder="1200000"
                                            required
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none focus:border-[#F45116]"
                                        />

                                        <span className="absolute right-4 top-3 text-sm text-gray-400">
                      đ
                    </span>

                                    </div>

                                </div>

                                {/* Deposit */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Tiền đặt cọc
                                    </label>

                                    <div className="relative">

                                        <input
                                            type="number"
                                            name="deposit"
                                            value={form.deposit}
                                            onChange={handleChange}
                                            placeholder="5000000"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none focus:border-[#F45116]"
                                        />

                                        <span className="absolute right-4 top-3 text-sm text-gray-400">
                      đ
                    </span>

                                    </div>

                                </div>

                                <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-semibold text-amber-800">Thiết bị sẽ chờ Admin duyệt</p>
                                    <p className="mt-1 text-xs leading-5 text-amber-700">Sau khi gửi, bạn vẫn có thể sửa thông tin. Thiết bị chưa xuất hiện trong danh mục cho đến khi được duyệt.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Thông số / từ khóa</label>
                                    <input name="tags" value={form.tags} onChange={handleChange} placeholder="Ví dụ: Full-frame, 4K, chống rung" className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]" />
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Mô tả
                                    </label>

                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        rows="6"
                                        placeholder="Mô tả chi tiết về thiết bị..."
                                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    />

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Image */}
                    <div>

                        <div className="rounded-xl border border-gray-200 bg-white p-6">

                            <h2 className="mb-5 text-lg font-semibold text-[#172033]">
                                Hình ảnh thiết bị
                            </h2>

                            <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-[#F45116]">

                                {image ? (

                                    <img
                                        src={image}
                                        alt="Preview"
                                        className="max-h-[240px] max-w-full rounded-lg object-contain"
                                    />

                                ) : (

                                    <>
                                        <div className="mb-3 text-4xl">
                                            📷
                                        </div>

                                        <p className="text-sm font-medium text-gray-700">
                                            Chọn hình ảnh
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            PNG, JPG hoặc WebP · tối đa 5 MB
                                        </p>
                                    </>

                                )}

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                            </label>

                        </div>

                    </div>

                </div>

                {/* Buttons */}
                <div className="mt-6 flex justify-end gap-3">

                    <Link
                        to="/owner/equipment"
                        className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
                    </Link>

                    <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-[#F45116] px-6 py-3 text-sm font-medium text-white hover:bg-[#d9430e] disabled:cursor-wait disabled:opacity-60"
                    >
                        {busy ? 'Đang gửi…' : 'Gửi xét duyệt'}
                    </button>

                </div>

                {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

            </form>

        </div>
    )
}
