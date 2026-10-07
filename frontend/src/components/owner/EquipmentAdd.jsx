import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories } from '../../data/products'

export default function EquipmentAdd() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        name: '',
        category: '',
        price: '',
        deposit: '',
        description: '',
        status: 'Sẵn sàng',
    })

    const [image, setImage] = useState(null)

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        })
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0]

        if (!file) return

        setImage(URL.createObjectURL(file))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        console.log({
            ...form,
            image,
        })

        alert('Thêm thiết bị thành công!')

        navigate('/owner/equipment')
    }

    return (
        <div className="min-h-screen bg-[#f7f8fa] p-6">

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
                    Đăng thiết bị mới lên LensRent
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
                                                value={item.keyword}
                                            >
                                                {item.name}
                                            </option>

                                        ))}

                                    </select>

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

                                {/* Status */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Trạng thái
                                    </label>

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    >

                                        <option value="Sẵn sàng">
                                            Sẵn sàng
                                        </option>

                                        <option value="Đang bảo trì">
                                            Đang bảo trì
                                        </option>

                                    </select>

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
                                            PNG, JPG hoặc JPEG
                                        </p>
                                    </>

                                )}

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
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
                        className="rounded-lg bg-[#F45116] px-6 py-3 text-sm font-medium text-white hover:bg-[#d9430e]"
                    >
                        Lưu thiết bị
                    </button>

                </div>

            </form>

        </div>
    )
}