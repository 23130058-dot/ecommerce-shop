import { useEffect, useState } from 'react'
import { resolveProductImage } from '../home/productImageMap.js'
import { getOwnerRevenue } from '../../services/ownerApi.js'

function asDateInput(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function defaultRange() {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 29)
    return { from: asDateInput(from), to: asDateInput(to) }
}

function formatMoney(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}đ`
}

function formatShortDate(value) {
    if (!value) return ''
    const [year, month, day] = value.split('-')
    return `${day}/${month}`
}

export default function Revenue() {
    const [range, setRange] = useState(defaultRange)
    const [draftRange, setDraftRange] = useState(defaultRange)
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        getOwnerRevenue({ ...range, signal: controller.signal })
            .then(setReport)
            .catch((loadError) => {
                if (loadError.name !== 'AbortError') setError(loadError.message)
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [range])

    const submitFilter = (event) => {
        event.preventDefault()
        if (!draftRange.from || !draftRange.to || draftRange.from > draftRange.to) {
            setError('Vui lòng chọn khoảng ngày hợp lệ.')
            return
        }
        setRange({ ...draftRange })
    }

    const days = report?.dailyRevenue || []
    const products = report?.productRevenue || []
    const maxRevenue = Math.max(0, ...days.map((item) => Number(item.amount || 0)))
    const dailyAverage = days.length
        ? Number(report?.totalRevenue || 0) / days.length
        : 0

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                    <div>
                        <p className="text-sm text-gray-500">Báo cáo / Doanh thu</p>
                        <h1 className="mt-1 text-3xl font-bold text-gray-900">Báo cáo doanh thu</h1>
                        <p className="mt-1 text-sm text-gray-500">Doanh thu tính từ các đơn đã thanh toán cho thiết bị của bạn.</p>
                    </div>

                    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-3" onSubmit={submitFilter}>
                        <label className="grid gap-1 text-xs font-medium text-gray-600">
                            Từ ngày
                            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#F45116]" onChange={(event) => setDraftRange((current) => ({ ...current, from: event.target.value }))} type="date" value={draftRange.from} />
                        </label>
                        <label className="grid gap-1 text-xs font-medium text-gray-600">
                            Đến ngày
                            <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#F45116]" onChange={(event) => setDraftRange((current) => ({ ...current, to: event.target.value }))} type="date" value={draftRange.to} />
                        </label>
                        <button className="rounded-lg bg-[#F45116] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d9430e]" type="submit">Lọc doanh thu</button>
                    </form>
                </div>

                {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Tổng doanh thu trong kỳ</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{loading && !report ? 'Đang tải…' : formatMoney(report?.totalRevenue)}</p>
                        <p className="mt-2 text-xs text-gray-500">{range.from} — {range.to}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Đơn đã thanh toán</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{loading && !report ? '…' : Number(report?.paidRentalCount || 0).toLocaleString('vi-VN')}</p>
                        <p className="mt-2 text-xs text-gray-500">Đơn có thiết bị của bạn trong kỳ</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                        <p className="text-sm text-gray-500">Thiết bị đang quản lý</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{loading && !report ? '…' : Number(report?.productCount || 0).toLocaleString('vi-VN')}</p>
                        <p className="mt-2 text-xs text-gray-500">Trung bình {formatMoney(dailyAverage)} / ngày trong kỳ</p>
                    </div>
                </div>

                <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Doanh thu theo ngày</h2>
                        <p className="mt-1 text-sm text-gray-500">Số liệu được tổng hợp theo ngày thanh toán thành công.</p>
                    </div>
                    {loading && !report ? (
                        <div className="flex h-64 items-center justify-center text-sm text-gray-500">Đang tải doanh thu…</div>
                    ) : (
                        <div className="overflow-x-auto pb-2">
                            <div className="flex h-[290px] min-w-full items-end gap-2 border-b border-l border-gray-200 px-3 pt-5">
                                {days.map((item) => {
                                    const amount = Number(item.amount || 0)
                                    const height = maxRevenue > 0 && amount > 0 ? Math.max(3, (amount / maxRevenue) * 100) : 0
                                    return (
                                        <div className="group flex h-full w-11 flex-none flex-col justify-end" key={item.date} title={`${item.date}: ${formatMoney(amount)}`}>
                                            <div className="relative flex flex-1 items-end justify-center">
                                                <div className="w-6 rounded-t-md bg-[#F45116] transition-colors group-hover:bg-[#d9430e]" style={{ height: `${height}%` }} />
                                                {amount > 0 && <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">{formatMoney(amount)}</span>}
                                            </div>
                                            <span className="h-8 pt-2 text-center text-[10px] text-gray-500">{formatShortDate(item.date)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </section>

                <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
                        <h2 className="text-lg font-bold text-gray-900">Doanh thu theo thiết bị</h2>
                        <p className="mt-1 text-sm text-gray-500">Tổng tiền thuê của các đơn đã thanh toán trong khoảng ngày đã chọn.</p>
                    </div>
                    {loading && !report ? (
                        <p className="px-6 py-12 text-center text-sm text-gray-500">Đang tải thiết bị…</p>
                    ) : products.length ? (
                        <div className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <article className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={product.productId}>
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-1">
                                            <img alt={product.name} className="max-h-full max-w-full object-contain" src={resolveProductImage(product.imageKey)} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-gray-800">{product.name}</p>
                                            <p className="mt-1 text-xs text-gray-500">{product.type || 'Thiết bị'} · {Number(product.paidRentalCount || 0)} đơn đã thanh toán</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                                        <div className="text-left sm:text-right">
                                            <p className="text-xs text-gray-500">Giá thuê / ngày</p>
                                            <p className="mt-1 font-medium text-gray-700">{formatMoney(product.dailyPrice)}</p>
                                        </div>
                                        <div className="min-w-32 text-left sm:text-right">
                                            <p className="text-xs text-gray-500">Doanh thu</p>
                                            <p className="mt-1 font-bold text-[#F45116]">{formatMoney(product.amount)}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="px-6 py-12 text-center text-sm text-gray-500">Chưa có thiết bị hoặc doanh thu trong khoảng ngày này.</p>
                    )}
                </section>
            </main>
        </div>
    )
}
