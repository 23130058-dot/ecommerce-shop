import { useState } from 'react'
import { Link } from 'react-router-dom'
import { products, categories } from '../../data/products'

export default function ScheduleSettings() {
    const [selectedProduct, setSelectedProduct] = useState(products[0])

    const [price, setPrice] = useState(products[0]?.price || 0)

    const [weekendPrice, setWeekendPrice] = useState(
        Math.round((products[0]?.price || 0) * 1.2)
    )

    const [deposit, setDeposit] = useState(
        (products[0]?.price || 0) * 3
    )

    const [blockedDates, setBlockedDates] = useState([
        '2026-10-10',
        '2026-10-20',
    ])

    const [newBlockedDate, setNewBlockedDate] = useState('')

    const [available, setAvailable] = useState(true)

    const handleProductChange = (e) => {
        const product = products.find(
            (_, index) => String(index) === e.target.value
        )

        if (!product) return

        setSelectedProduct(product)

        setPrice(product.price)

        setWeekendPrice(
            Math.round(product.price * 1.2)
        )

        setDeposit(product.price * 3)
    }

    const addBlockedDate = () => {
        if (!newBlockedDate) return

        if (blockedDates.includes(newBlockedDate)) {
            alert('Ngày này đã có trong danh sách.')
            return
        }

        setBlockedDates([
            ...blockedDates,
            newBlockedDate,
        ])

        setNewBlockedDate('')
    }

    const removeBlockedDate = (date) => {
        setBlockedDates(
            blockedDates.filter(
                (item) => item !== date
            )
        )
    }

    const handleSave = () => {
        const data = {
            product: selectedProduct.name,
            price,
            weekendPrice,
            deposit,
            available,
            blockedDates,
        }

        console.log('Schedule settings:', data)

        alert('Đã lưu thiết lập lịch và giá!')
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
          Thiết lập lịch và giá
        </span>

            </div>

            {/* Header */}
            <div className="mb-6">

                <h1 className="text-2xl font-semibold text-[#172033]">
                    Thiết lập lịch và giá
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Thiết lập giá thuê và thời gian nhận đơn cho thiết bị
                </p>

            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                {/* Left */}
                <div className="xl:col-span-2">

                    {/* Select product */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-5 text-lg font-semibold text-[#172033]">
                            Chọn thiết bị
                        </h2>

                        <select
                            value={products.findIndex(
                                (item) => item.name === selectedProduct.name
                            )}
                            onChange={handleProductChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                        >

                            {products.map((product, index) => (

                                <option
                                    key={product.name}
                                    value={index}
                                >
                                    {product.name}
                                </option>

                            ))}

                        </select>

                        {/* Product preview */}
                        <div className="mt-5 flex items-center gap-4 rounded-xl bg-gray-50 p-4">

                            <div className="flex h-20 w-24 items-center justify-center rounded-lg bg-white">

                                <img
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    className="h-full w-full object-contain"
                                />

                            </div>

                            <div>

                                <h3 className="font-medium text-[#172033]">
                                    {selectedProduct.name}
                                </h3>

                                <p className="mt-1 text-xs text-gray-500">
                                    {selectedProduct.type}
                                </p>

                                <p className="mt-2 text-sm text-[#F45116]">
                                    {selectedProduct.price.toLocaleString('vi-VN')} đ/ngày
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Pricing */}
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-5 text-lg font-semibold text-[#172033]">
                            Giá thuê
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Giá ngày thường
                                </label>

                                <div className="relative">

                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) =>
                                            setPrice(Number(e.target.value))
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none focus:border-[#F45116]"
                                    />

                                    <span className="absolute right-4 top-3 text-sm text-gray-400">
                    đ
                  </span>

                                </div>

                            </div>

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Giá cuối tuần
                                </label>

                                <div className="relative">

                                    <input
                                        type="number"
                                        value={weekendPrice}
                                        onChange={(e) =>
                                            setWeekendPrice(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none focus:border-[#F45116]"
                                    />

                                    <span className="absolute right-4 top-3 text-sm text-gray-400">
                    đ
                  </span>

                                </div>

                            </div>

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Tiền đặt cọc
                                </label>

                                <div className="relative">

                                    <input
                                        type="number"
                                        value={deposit}
                                        onChange={(e) =>
                                            setDeposit(
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 text-sm outline-none focus:border-[#F45116]"
                                    />

                                    <span className="absolute right-4 top-3 text-sm text-gray-400">
                    đ
                  </span>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Availability */}
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                        <div className="flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-semibold text-[#172033]">
                                    Cho phép nhận đơn
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Cho phép khách hàng đặt thiết bị này
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setAvailable(!available)
                                }
                                className={`relative h-7 w-12 rounded-full transition ${
                                    available
                                        ? 'bg-[#F45116]'
                                        : 'bg-gray-300'
                                }`}
                            >

                <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        available
                            ? 'left-6'
                            : 'left-1'
                    }`}
                />

                            </button>

                        </div>

                    </div>

                    {/* Block dates */}
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-2 text-lg font-semibold text-[#172033]">
                            Ngày không nhận đơn
                        </h2>

                        <p className="mb-5 text-sm text-gray-500">
                            Chọn những ngày thiết bị không thể cho thuê.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">

                            <input
                                type="date"
                                value={newBlockedDate}
                                onChange={(e) =>
                                    setNewBlockedDate(e.target.value)
                                }
                                className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                            />

                            <button
                                type="button"
                                onClick={addBlockedDate}
                                className="rounded-lg border border-[#F45116] px-5 py-3 text-sm font-medium text-[#F45116] hover:bg-orange-50"
                            >
                                + Thêm ngày
                            </button>

                        </div>

                        <div className="mt-5 space-y-2">

                            {blockedDates.map((date) => (

                                <div
                                    key={date}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                                >

                  <span className="text-sm text-gray-700">
                    {new Date(
                        `${date}T00:00:00`
                    ).toLocaleDateString('vi-VN')}
                  </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeBlockedDate(date)
                                        }
                                        className="text-sm text-red-500 hover:text-red-700"
                                    >
                                        Xóa
                                    </button>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

                {/* Right */}
                <div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-5 text-lg font-semibold text-[#172033]">
                            Tổng quan
                        </h2>

                        <div className="space-y-4">

                            <div className="flex justify-between border-b border-gray-100 pb-4">

                <span className="text-sm text-gray-500">
                  Thiết bị
                </span>

                                <span className="max-w-[170px] text-right text-sm font-medium text-gray-700">
                  {selectedProduct.name}
                </span>

                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-4">

                <span className="text-sm text-gray-500">
                  Giá ngày thường
                </span>

                                <span className="text-sm font-medium text-[#F45116]">
                  {price.toLocaleString('vi-VN')} đ
                </span>

                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-4">

                <span className="text-sm text-gray-500">
                  Giá cuối tuần
                </span>

                                <span className="text-sm font-medium text-[#F45116]">
                  {weekendPrice.toLocaleString('vi-VN')} đ
                </span>

                            </div>

                            <div className="flex justify-between border-b border-gray-100 pb-4">

                <span className="text-sm text-gray-500">
                  Tiền cọc
                </span>

                                <span className="text-sm font-medium text-gray-700">
                  {deposit.toLocaleString('vi-VN')} đ
                </span>

                            </div>

                            <div className="flex justify-between">

                <span className="text-sm text-gray-500">
                  Trạng thái
                </span>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                        available
                                            ? 'bg-green-50 text-green-600'
                                            : 'bg-gray-100 text-gray-500'
                                    }`}
                                >
                  {available
                      ? 'Đang nhận đơn'
                      : 'Tạm ngưng'}
                </span>

                            </div>

                        </div>

                    </div>

                    {/* Category */}
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">

                        <h2 className="mb-4 text-lg font-semibold text-[#172033]">
                            Danh mục
                        </h2>

                        {categories.map((item) => (

                            <div
                                key={item.keyword}
                                className={`mb-2 flex items-center gap-3 rounded-lg p-3 ${
                                    selectedProduct.category.includes(
                                        item.keyword
                                    )
                                        ? 'bg-orange-50'
                                        : 'bg-gray-50'
                                }`}
                            >

                                <img
                                    src={item.icon}
                                    alt={item.name}
                                    className="h-8 w-8"
                                />

                                <span className="text-sm text-gray-700">
                  {item.name}
                </span>

                            </div>

                        ))}

                    </div>

                </div>

            </div>

            {/* Bottom */}
            <div className="mt-6 flex justify-end gap-3">

                <Link
                    to="/owner/equipment"
                    className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Hủy
                </Link>

                <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-[#F45116] px-6 py-3 text-sm font-medium text-white hover:bg-[#d9430e]"
                >
                    Lưu thiết lập
                </button>

            </div>

        </div>
    )
}