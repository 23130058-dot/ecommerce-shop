import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { products, categories } from '../../data/products'

export default function EquipmentList() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [status, setStatus] = useState('all')

    const equipment = useMemo(() => {
        return products.map((product, index) => {
            const categoryInfo = categories.find((item) =>
                product.category.includes(item.keyword)
            )

            return {
                ...product,
                id: index + 1,
                categoryName: categoryInfo?.name || 'Khác',
                condition: 'Tốt',
            }
        })
    }, [])

    const filteredEquipment = equipment.filter((item) => {
        const keyword = search.toLowerCase().trim()

        const matchSearch =
            item.name.toLowerCase().includes(keyword) ||
            item.type.toLowerCase().includes(keyword)

        const matchCategory =
            category === 'all' ||
            item.category.includes(category)

        const matchStatus =
            status === 'all' ||
            (status === 'available' && item.status === 'Sẵn sàng') ||
            (status === 'rented' && item.status === 'Đã thuê')

        return matchSearch && matchCategory && matchStatus
    })

    const availableCount = equipment.filter(
        (item) => item.status === 'Sẵn sàng'
    ).length

    const rentedCount = equipment.filter(
        (item) => item.status === 'Đã thuê'
    ).length

    return (
        <div className="min-h-screen bg-[#f7f8fa] p-6">

            {/* Breadcrumb */}
            <div className="mb-5 text-sm text-gray-500">
                Quản lý cho thuê
                <span className="mx-2">/</span>
                <span className="text-gray-800">
          Quản lý thiết bị
        </span>
            </div>

            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>
                    <h1 className="text-2xl font-semibold text-[#172033]">
                        Quản lý thiết bị
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Quản lý các thiết bị bạn đang đăng cho thuê
                    </p>
                </div>

                <Link
                    to="/owner/equipment/add"
                    className="inline-flex items-center justify-center rounded-lg bg-[#F45116] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#d9430e]"
                >
                    <span className="mr-2 text-lg">+</span>
                    Thêm thiết bị
                </Link>

            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                        Tổng thiết bị
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-[#172033]">
                        {equipment.length}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                        Đang sẵn sàng
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-green-600">
                        {availableCount}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <p className="text-sm text-gray-500">
                        Đang được thuê
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-blue-600">
                        {rentedCount}
                    </p>
                </div>

            </div>

            {/* Filters */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

                    {/* Search */}
                    <div className="md:col-span-1">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm kiếm thiết bị..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#F45116]"
                        />
                    </div>

                    {/* Category */}
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                    >
                        <option value="all">
                            Tất cả danh mục
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

                    {/* Status */}
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                    >
                        <option value="all">
                            Tất cả trạng thái
                        </option>

                        <option value="available">
                            Sẵn sàng
                        </option>

                        <option value="rented">
                            Đã thuê
                        </option>
                    </select>

                </div>

            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[950px]">

                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Thiết bị
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Danh mục
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Giá thuê
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Đánh giá
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Trạng thái
                            </th>

                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                                Thao tác
                            </th>

                        </tr>
                        </thead>

                        <tbody>

                        {filteredEquipment.map((item) => (

                            <tr
                                key={item.id}
                                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                            >

                                {/* Product */}
                                <td className="px-5 py-4">

                                    <div className="flex items-center gap-4">

                                        <div className="flex h-16 w-20 items-center justify-center rounded-lg bg-gray-50">

                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full rounded-lg object-contain"
                                            />

                                        </div>

                                        <div>

                                            <p className="font-medium text-[#172033]">
                                                {item.name}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {item.type}
                                            </p>

                                        </div>

                                    </div>

                                </td>

                                {/* Category */}
                                <td className="px-5 py-4">

                    <span className="text-sm text-gray-600">
                      {item.categoryName}
                    </span>

                                </td>

                                {/* Price */}
                                <td className="px-5 py-4">

                                    <p className="text-sm font-medium text-[#172033]">
                                        {item.price.toLocaleString('vi-VN')} đ
                                    </p>

                                    <p className="text-xs text-gray-400">
                                        / ngày
                                    </p>

                                </td>

                                {/* Rating */}
                                <td className="px-5 py-4">

                                    <div className="flex items-center gap-1">

                      <span className="text-yellow-500">
                        ★
                      </span>

                                        <span className="text-sm font-medium text-gray-700">
                        {item.rating}
                      </span>

                                    </div>

                                </td>

                                {/* Status */}
                                <td className="px-5 py-4">

                                    {item.status === 'Sẵn sàng' ? (

                                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                        Sẵn sàng
                      </span>

                                    ) : (

                                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                        Đã thuê
                      </span>

                                    )}

                                </td>

                                {/* Actions */}
                                <td className="px-5 py-4">

                                    <div className="flex justify-end gap-2">

                                        <Link
                                            to={`/owner/equipment/${item.id}/edit`}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-[#F45116] hover:text-[#F45116]"
                                        >
                                            Sửa
                                        </Link>

                                        <Link
                                            to={`/owner/product/${item.id}`}
                                            className="rounded-lg border border-[#F45116] px-3 py-2 text-xs font-medium text-[#F45116] transition hover:bg-orange-50"
                                        >
                                            Chi tiết
                                        </Link>

                                    </div>

                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>

                </div>

                {filteredEquipment.length === 0 && (

                    <div className="py-12 text-center text-sm text-gray-500">
                        Không tìm thấy thiết bị phù hợp.
                    </div>

                )}

            </div>

        </div>
    )
}