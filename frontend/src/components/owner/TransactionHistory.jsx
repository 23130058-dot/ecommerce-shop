import { useState } from 'react'
import { transactions } from '../../data/ownerData'

export default function TransactionHistory() {
    const [showWithdraw, setShowWithdraw] = useState(false)

    const formatMoney = (value) => {
        const sign = value > 0 ? '+' : ''
        return sign + value.toLocaleString('vi-VN') + ' đ'
    }

    return (
        <main className="min-h-screen bg-[#F7F8FA] px-6 py-7">
            <div className="mx-auto max-w-[1000px]">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-[23px] font-bold text-gray-800">
                            Lịch sử giao dịch
                        </h1>

                        <p className="mt-1 text-sm text-gray-400">
                            Theo dõi chi tiết dòng tiền nhận từ đơn thuê.
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">

                    <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] bg-[#FAFBFC] px-5 py-4 text-[10px] font-bold uppercase text-gray-400">
                        <span>Mã giao dịch / Nội dung</span>
                        <span>Thời gian</span>
                        <span>Loại giao dịch</span>
                        <span>Số tiền</span>
                        <span>Trạng thái</span>
                    </div>

                    {transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] items-center border-t border-gray-100 px-5 py-5"
                        >

                            <div>
                                <p className="text-xs font-bold text-gray-700">
                                    {transaction.title}
                                </p>

                                <p className="mt-1 text-[10px] text-gray-400">
                                    {transaction.sub}
                                </p>
                            </div>

                            <span className="text-xs text-gray-500">
                {transaction.date}
              </span>

                            <span>
                <span
                    className={`rounded px-2 py-1 text-[10px] font-bold ${
                        transaction.type === 'Tiền thuê'
                            ? 'bg-blue-50 text-blue-500'
                            : 'bg-purple-50 text-purple-500'
                    }`}
                >
                  {transaction.type}
                </span>
              </span>

                            <strong
                                className={`text-xs ${
                                    transaction.amount > 0
                                        ? 'text-green-600'
                                        : 'text-gray-700'
                                }`}
                            >
                                {formatMoney(transaction.amount)}
                            </strong>

                            <span>
                <span className="rounded bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                  {transaction.status}
                </span>
              </span>

                        </div>
                    ))}

                </div>

            </div>

            {/* Withdraw modal */}
            {showWithdraw && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5">

                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">
                                Rút tiền về ngân hàng
                            </h2>

                            <button
                                onClick={() => setShowWithdraw(false)}
                                className="text-xl text-gray-400"
                            >
                                ×
                            </button>
                        </div>

                        <p className="mt-1 text-xs text-gray-400">
                            Tiền sẽ được chuyển về tài khoản ngân hàng đã xác minh.
                        </p>

                        <div className="mt-5 rounded-lg bg-[#FFF6ED] p-4">
                            <p className="text-xs text-gray-500">
                                Số dư khả dụng
                            </p>

                            <p className="mt-1 text-2xl font-bold text-[#F45116]">
                                28,450,000 đ
                            </p>
                        </div>

                        <label className="mt-5 block text-xs font-bold text-gray-700">
                            Số tiền muốn rút
                        </label>

                        <input
                            placeholder="Nhập số tiền"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#F45116]"
                        />

                        <div className="mt-4 rounded-lg border border-gray-200 p-4">
                            <p className="text-xs text-gray-400">
                                Tài khoản nhận
                            </p>

                            <p className="mt-1 text-sm font-bold text-gray-700">
                                MBBank ****8888
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setShowWithdraw(false)
                                alert('Yêu cầu rút tiền đã được gửi.')
                            }}
                            className="mt-5 w-full rounded-lg bg-[#F45116] py-3 text-sm font-bold text-white"
                        >
                            Xác nhận rút tiền
                        </button>

                    </div>

                </div>
            )}
        </main>
    )
}