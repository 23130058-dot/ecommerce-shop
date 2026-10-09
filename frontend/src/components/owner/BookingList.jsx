import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerIcon from './OwnerIcon'

const bookings = [
    {
        id: '#LR-10021',
        customer: 'Nguyễn Văn A',
        phone: '0901 234 567',
        product: 'Sony A7IV + Lens 24-70mm',
        startDate: '15/06/2026',
        endDate: '18/06/2026',
        total: 3600000,
        deposit: 5000000,
        status: 'Chờ xác nhận',
    },
    {
        id: '#LR-10022',
        customer: 'Trần Thị B',
        phone: '0912 345 678',
        product: 'DJI Mavic 3 Pro',
        startDate: '20/06/2026',
        endDate: '22/06/2026',
        total: 5000000,
        deposit: 5000000,
        status: 'Đã xác nhận',
    },
    {
        id: '#LR-10023',
        customer: 'Lê Minh C',
        phone: '0988 123 456',
        product: 'Canon RF 15-35mm',
        startDate: '25/06/2026',
        endDate: '27/06/2026',
        total: 1350000,
        deposit: 3000000,
        status: 'Đang thuê',
    },
]

const formatMoney = (value) =>
    new Intl.NumberFormat('vi-VN').format(value) + ' đ'

export default function BookingList() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('all')

    const filteredBookings = bookings.filter((booking) => {
        if (tab === 'all') return true
        if (tab === 'pending') return booking.status === 'Chờ xác nhận'
        if (tab === 'confirmed') return booking.status === 'Đã xác nhận'
        if (tab === 'renting') return booking.status === 'Đang thuê'
        return true
    })

    const statusClass = (status) => {
        if (status === 'Chờ xác nhận') {
            return 'bg-orange-50 text-orange-600'
        }

        if (status === 'Đang thuê') {
            return 'bg-blue-50 text-blue-600'
        }

        return 'bg-green-50 text-green-600'
    }

    return (
        <div className="min-h-[calc(100vh-68px)] px-6 py-7 lg:px-8">

            <div className="mx-auto max-w-[1180px]">

                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-400">
                            <span>Quản lý cho thuê</span>
                            <span>/</span>
                            <span className="text-gray-600">Đơn khách đặt</span>
                        </div>

                        <h1 className="text-[26px] font-bold text-[#172033]">
                            Đơn khách đặt
                        </h1>

                        <p className="mt-1 text-[12px] text-gray-500">
                            Quản lý và xác nhận các đơn thuê thiết bị từ khách hàng.
                        </p>
                    </div>

                    <div className="relative">
                        <OwnerIcon
                            name="booking"
                            size={14}
                        />
                    </div>

                </div>

                {/* Stats */}
                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] text-gray-400">
                            Tổng đơn
                        </p>

                        <p className="mt-2 text-xl font-bold text-gray-900">
                            15
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] text-gray-400">
                            Chờ xác nhận
                        </p>

                        <p className="mt-2 text-xl font-bold text-[#F45116]">
                            3
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-[11px] text-gray-400">
                            Đang thuê
                        </p>

                        <p className="mt-2 text-xl font-bold text-blue-600">
                            5
                        </p>
                    </div>

                </div>

                {/* Tabs */}
                <div className="mt-6 border-b border-gray-200">
                    <div className="flex gap-6">

                        {[
                            ['all', 'Tất cả'],
                            ['pending', 'Chờ xác nhận'],
                            ['confirmed', 'Đã xác nhận'],
                            ['renting', 'Đang thuê'],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`
                                    border-b-2 px-1 py-3
                                    text-[11px]
                                    ${
                                    tab === key
                                        ? 'border-[#F45116] font-medium text-[#F45116]'
                                        : 'border-transparent text-gray-500'
                                }
                                `}
                            >
                                {label}
                            </button>
                        ))}

                    </div>
                </div>

                {/* Table */}
                <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px] text-left">

                            <thead className="border-b border-gray-200 bg-gray-50">
                            <tr className="text-[10px] font-semibold uppercase text-gray-400">
                                <th className="px-5 py-3">Đơn thuê</th>
                                <th className="px-5 py-3">Khách thuê</th>
                                <th className="px-5 py-3">Thiết bị</th>
                                <th className="px-5 py-3">Thời gian</th>
                                <th className="px-5 py-3">Tổng tiền</th>
                                <th className="px-5 py-3">Trạng thái</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                            {filteredBookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="text-[11px] text-gray-700"
                                >

                                    <td className="px-5 py-4 font-semibold text-gray-900">
                                        {booking.id}
                                    </td>

                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-800">
                                            {booking.customer}
                                        </p>

                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {booking.phone}
                                        </p>
                                    </td>

                                    <td className="max-w-[180px] px-5 py-4">
                                        {booking.product}
                                    </td>

                                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                        {booking.startDate}
                                        <br />
                                        →
                                        <br />
                                        {booking.endDate}
                                    </td>

                                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                                        {formatMoney(booking.total)}
                                    </td>

                                    <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClass(booking.status)}`}
                                            >
                                                {booking.status}
                                            </span>
                                    </td>

                                    <td className="px-5 py-4">

                                        <button
                                            type="button"
                                            onClick={() => navigate('/owner/confirmation')}
                                            className="whitespace-nowrap rounded-lg bg-[#F45116] px-3 py-2 text-[10px] font-medium text-white hover:bg-[#df450f]"
                                        >
                                            Xem đơn
                                        </button>

                                    </td>

                                </tr>
                            ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>
    )
}