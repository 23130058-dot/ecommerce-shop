import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { confirmZaloPayWalletTopUp, getZaloPayWalletTopUpStatus } from '../services/accountApi.js'
import { getStoredAuth } from '../services/authApi.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

export default function WalletTopUpResultPage() {
  const [searchParams] = useSearchParams()
  const appTransId = searchParams.get('apptransid') || searchParams.get('orderId') || ''
  const appId = searchParams.get('appid') || ''
  const pmcId = searchParams.get('pmcid') || ''
  const bankCode = searchParams.get('bankcode') || ''
  const amount = searchParams.get('amount') || ''
  const discountAmount = searchParams.get('discountamount') || ''
  const paymentStatus = searchParams.get('status') || ''
  const checksum = searchParams.get('checksum') || ''
  const auth = getStoredAuth()
  const accessToken = auth?.accessToken || ''
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const hasSignedRedirect = ['appid', 'apptransid', 'pmcid', 'bankcode', 'amount', 'discountamount', 'status', 'checksum']
    .every((key) => searchParams.has(key))

  const checkPayment = async () => {
    if (!appTransId) {
      setError('Không có mã đơn ZaloPay trong đường dẫn trả về.')
      setChecking(false)
      return
    }
    setChecking(true)
    setError('')
    try {
      const result = hasSignedRedirect
        ? await confirmZaloPayWalletTopUp({ appId, appTransId, pmcId, bankCode, amount, discountAmount, status: paymentStatus, checksum })
        : await getZaloPayWalletTopUpStatus(appTransId)
      setStatus(result)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    if (!accessToken || !appTransId) {
      setChecking(false)
      return
    }
    checkPayment()
  // Redirect values are stable URL parameters for the life of this result page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, appTransId, appId, pmcId, bankCode, amount, discountAmount, paymentStatus, checksum])

  if (!auth) return <Navigate to="/login" replace state={{ from: { pathname: '/wallet/top-up-result', search: window.location.search } }} />

  const completed = status?.status === 'COMPLETED'
  const failed = status?.status === 'FAILED'
  return <div className="flex min-h-screen flex-col bg-[#f7f8fa] font-sans text-slate-900">
    <Header />
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className={`mx-auto flex size-16 items-center justify-center rounded-full text-3xl font-bold ${completed ? 'bg-emerald-50 text-emerald-600' : failed ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#ff5500]'}`}>
          {checking ? '…' : completed ? '✓' : failed ? '×' : '…'}
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">{checking ? 'Đang xác nhận thanh toán' : completed ? 'Nạp ví thành công' : failed ? 'Thanh toán không thành công' : 'Đang chờ xác nhận'}</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {completed ? 'ZaloPay đã xác nhận giao dịch và số dư ví LensRent đã được cập nhật.'
            : failed ? 'Giao dịch ZaloPay Sandbox không hoàn tất. Số dư ví được giữ nguyên.'
              : 'LensRent chỉ cộng tiền sau khi xác minh redirect và tra cứu được giao dịch thành công từ máy chủ ZaloPay.'}
        </p>
        {!appTransId && <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Không có mã giao dịch trong đường dẫn trả về.</p>}
        {appTransId && <div className="mx-auto mt-6 max-w-md rounded-xl bg-slate-50 p-4 text-left text-sm">
          <div className="flex justify-between gap-4"><span className="text-slate-500">Mã giao dịch</span><span className="break-all text-right font-semibold">{appTransId}</span></div>
          {status?.amount != null && <div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Số tiền</span><span className="font-bold">{money(status.amount)}</span></div>}
          <div className="mt-2 flex justify-between gap-4"><span className="text-slate-500">Trạng thái</span><span className={`font-semibold ${completed ? 'text-emerald-700' : failed ? 'text-red-700' : 'text-amber-700'}`}>{completed ? 'Hoàn tất' : failed ? 'Thất bại' : checking ? 'Đang kiểm tra' : 'Đang chờ ZaloPay'}</span></div>
        </div>}
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {!completed && !failed && appTransId && <p className="mt-4 text-xs text-slate-500">Nếu bạn vừa thanh toán xong, hãy bấm kiểm tra lại. Có thể ZaloPay cần thêm thời gian để cập nhật trạng thái.</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {!completed && !failed && appTransId && <button className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={checking} onClick={checkPayment} type="button">Kiểm tra lại</button>}
          <Link className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600" to="/renter/wallet">Quay lại ví</Link>
          <Link className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50" to="/account/settings/payments">Thanh toán & Ví</Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
