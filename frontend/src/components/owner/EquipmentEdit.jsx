import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { products, categories } from '../../data/products'

export default function EquipmentEdit() {
    const { id } = useParams()
    const navigate = useNavigate()

    const productIndex = Number(id) - 1

    const product =
        products[productIndex] || products[0]

    const categoryInfo = categories.find((item) =>
        product.category.includes(item.keyword)
    )

    const [form, setForm] = useState({
        name: product.name,
        category: categoryInfo?.keyword || '',
        price: product.price,
        deposit: product.price * 3,
        description: '',
        status: product.status,
    })

    const [image, setImage] = useState(product.image)

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
            id,
            ...form,
            image,
        })

        alert('Cập nhật thiết bị thành công!')

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
          Sửa thiết bị
        </span>

            </div>

            {/* Header */}
            <div className="mb-6">

                <h1 className="text-2xl font-semibold text-[#172033]">
                    Sửa thông tin thiết bị
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Cập nhật thông tin cho {product.name}
                </p>

            </div>

            <form onSubmit={handleSubmit}>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                    {/* Form */}
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
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    >

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

                                    <input
                                        type="number"
                                        name="price"
                                        value={form.price}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    />

                                </div>

                                {/* Deposit */}
                                <div>

                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Tiền đặt cọc
                                    </label>

                                    <input
                                        type="number"
                                        name="deposit"
                                        value={form.deposit}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                                    />

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

                                        <option value="Đã thuê">
                                            Đã thuê
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
                                        placeholder="Mô tả thiết bị..."
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
                                Hình ảnh
                            </h2>

                            <label className="flex min-h-[280px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 hover:border-[#F45116]">

                                <img
                                    src={image}
                                    alt={product.name}
                                    className="max-h-[250px] max-w-full object-contain"
                                />

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                            </label>

                            <p className="mt-3 text-center text-xs text-gray-400">
                                Nhấn vào hình để thay đổi ảnh
                            </p>

                        </div>

                        {/* Product information */}
                        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                            <h2 className="mb-4 text-lg font-semibold text-[#172033]">
                                Thông tin hiện tại
                            </h2>

                            <div className="space-y-3 text-sm">

                                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Đánh giá
                  </span>

                                    <span className="font-medium text-gray-700">
                    ★ {product.rating}
                  </span>
                                </div>

                                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Loại
                  </span>

                                    <span className="font-medium text-gray-700">
                    {product.type}
                  </span>
                                </div>

                            </div>

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
                        Lưu thay đổi
                    </button>

                </div>

            </form>

        </div>
    )
}