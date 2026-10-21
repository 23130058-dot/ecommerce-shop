import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../../data/products'

export default function RentalHistory() {
    const [statusFilter, setStatusFilter] = useState('all')
    const [search, setSearch] = useState('')

    const rentalHistory = useMemo(() => {
        return [
            {
                id: 'LR001',
                productId: 1,
                customer: 'Nguyễn Minh Anh',
                phone: '0901 234 567',
                startDate: '2026-10-01',
                endDate: '2026-10-03',
                status: 'completed',
                total: products[0].price * 3,
            },
            {
                id: 'LR002',
                productId: 2,
                customer: 'Trần Hoàng Nam',
                phone: '0912 345 678',
                startDate: '2026-10-05',
                endDate: '2026-10-08',
                status: 'renting',
                total: products[1].price * 4,
            },
            {
                id: 'LR003',
                productId: 3,
                customer: 'Lê Thu Hà',
                phone: '0987 654 321',
                startDate: '2026-10-10',
                endDate: '2026-10-12',
                status: 'upcoming',
                total: products[2].price * 3,
            },
            {
                id: 'LR004',
                productId: 4,
                customer: 'Phạm Quốc Bảo',
                phone: '0933 222 111',
                startDate: '2026-09-20',
                endDate: '2026-09-22',
                status: 'completed',
                total: products[3].price * 3,
            },
        ].map((rental) => ({
            ...rental,
            product: products[rental.productId - 1],
        }))
    }, [])

    const filteredHistory = rentalHistory.filter((item) => {
        const keyword = search.toLowerCase().trim()

        const matchSearch =
            item.id.toLowerCase().includes(keyword) ||
            item.customer.toLowerCase().includes(keyword) ||
            item.product.name.toLowerCase().includes(keyword)

        const matchStatus =
            statusFilter === 'all' ||
            item.status === statusFilter

        return matchSearch && matchStatus
    })

    const statusConfig = {
        completed: {
            label: 'Đã hoàn tất',
            className: 'bg-green-50 text-green-600',
        },

        renting: {
            label: 'Đang thuê',
            className: 'bg-blue-50 text-blue-600',
        },

        upcoming: {
            label: 'Sắp thuê',
            className: 'bg-orange-50 text-orange-600',
        },
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
          Lịch sử cho thuê
        </span>

            </div>

            {/* Header */}
            <div className="mb-6">

                <h1 className="text-2xl font-semibold text-[#172033]">
                    Lịch sử cho thuê
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Theo dõi các đơn thuê thiết bị của bạn
                </p>

            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl border border-gray-200 bg-white p-5">

                    <p className="text-sm text-gray-500">
                        Tổng đơn
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-[#172033]">
                        {rentalHistory.length}
                    </p>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">

                    <p className="text-sm text-gray-500">
                        Đang thuê
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-blue-600">
                        {
                            rentalHistory.filter(
                                (item) => item.status === 'renting'
                            ).length
                        }
                    </p>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">

                    <p className="text-sm text-gray-500">
                        Sắp thuê
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-orange-500">
                        {
                            rentalHistory.filter(
                                (item) => item.status === 'upcoming'
                            ).length
                        }
                    </p>

                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5">

                    <p className="text-sm text-gray-500">
                        Hoàn tất
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-green-600">
                        {
                            rentalHistory.filter(
                                (item) => item.status === 'completed'
                            ).length
                        }
                    </p>

                </div>

            </div>

            {/* Filter */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4">

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                    <input
                        type="text"
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Tìm mã đơn, khách hàng hoặc thiết bị..."
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                    >

                        <option value="all">
                            Tất cả trạng thái
                        </option>

                        <option value="renting">
                            Đang thuê
                        </option>

                        <option value="upcoming">
                            Sắp thuê
                        </option>

                        <option value="completed">
                            Đã hoàn tất
                        </option>

                    </select>

                </div>

            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px]">

                        <thead>

                        <tr className="border-b border-gray-200 bg-gray-50">

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Mã đơn
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Thiết bị
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Người thuê
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Thời gian thuê
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Tổng tiền
                            </th>

                            <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                                Trạng thái
                            </th>

                            <th className="px-5 py-4 text-right text-xs font-semibold uppercase text-gray-500">
                                Chi tiết
                            </th>

                        </tr>

                        </thead>

                        <tbody>

                        {filteredHistory.map((item) => {

                            const status =
                                statusConfig[item.status]

                            return (

                                <tr
                                    key={item.id}
                                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                                >

                                    {/* ID */}
                                    <td className="px-5 py-4">

                      <span className="text-sm font-medium text-[#172033]">
                        {item.id}
                      </span>

                                    </td>

                                    {/* Product */}
                                    <td className="px-5 py-4">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-14 w-16 items-center justify-center rounded-lg bg-gray-50">

                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    className="h-full w-full object-contain"
                                                />

                                            </div>

                                            <div>

                                                <p className="text-sm font-medium text-[#172033]">
                                                    {item.product.name}
                                                </p>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    {item.product.type}
                                                </p>

                                            </div>

                                        </div>

                                    </td>

                                    {/* Customer */}
                                    <td className="px-5 py-4">

                                        <p className="text-sm font-medium text-gray-700">
                                            {item.customer}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            {item.phone}
                                        </p>

                                    </td>

                                    {/* Dates */}
                                    <td className="px-5 py-4">

                                        <p className="text-sm text-gray-700">
                                            {new Date(
                                                `${item.startDate}T00:00:00`
                                            ).toLocaleDateString('vi-VN')}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            đến{' '}
                                            {new Date(
                                                `${item.endDate}T00:00:00`
                                            ).toLocaleDateString('vi-VN')}
                                        </p>

                                    </td>

                                    {/* Total */}
                                    <td className="px-5 py-4">

                      <span className="text-sm font-medium text-[#F45116]">
                        {item.total.toLocaleString(
                            'vi-VN'
                        )}{' '}
                          đ
                      </span>

                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">

                      <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>

                                    </td>

                                    {/* Detail */}
                                    <td className="px-5 py-4 text-right">

                                        <Link
                                            to={`/owner/product/${item.productId}`}
                                            className="rounded-lg border border-[#F45116] px-3 py-2 text-xs font-medium text-[#F45116] hover:bg-orange-50"
                                        >
                                            Xem chi tiết
                                        </Link>

                                    </td>

                                </tr>

                            )
                        })}

                        </tbody>

                    </table>

                </div>

                {filteredHistory.length === 0 && (

                    <div className="py-12 text-center text-sm text-gray-500">
                        Không tìm thấy lịch sử cho thuê.
                    </div>

                )}

            </div>

        </div>
    )
}