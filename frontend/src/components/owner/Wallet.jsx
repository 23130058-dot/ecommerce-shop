import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../shared/DataTable.jsx'
import { getOwnerTransactions, getOwnerWallet, requestOwnerWithdrawal } from '../../services/ownerApi.js'
import { showToast } from '../../services/toast.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [walletData, transactionData] = await Promise.all([getOwnerWallet(), getOwnerTransactions()])
      setWallet(walletData)
      setTransactions(Array.isArray(transactionData) ? transactionData : [])
    } catch (requestError) {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const withdraw = async (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 10000 || value > 50000000) {
      setError('Số tiền rút phải từ 10.000đ đến 50.000.000đ.')
      return
    }
    setSaving(true)
    setError('')
    try {
      setWallet(await requestOwnerWithdrawal(value))
      setAmount('')
      showToast('Đã ghi nhận yêu cầu rút tiền. Số dư ví tài khoản đã được cập nhật.', 'success')
      await load()
    } catch (requestError) {
      setError(requestError.message)
      showToast(requestError.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'title', header: 'Giao dịch', className: 'min-w-[180px]', render: (row) => <div><p className="font-semibold text-gray-800">{row.title}</p><p className="mt-1 text-[11px] text-gray-500">{row.subtitle || '—'}</p></div> },
    { key: 'createdAt', header: 'Thời gian', className: 'whitespace-nowrap', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—' },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${row.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : row.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{row.status === 'COMPLETED' ? 'Hoàn tất' : row.status === 'PENDING' ? 'Đang chờ' : 'Thất bại'}</span> },
    { key: 'amount', header: 'Số tiền', className: 'whitespace-nowrap text-right', cellClassName: 'text-right', render: (row) => <span className={`font-bold ${Number(row.amount) >= 0 ? 'text-emerald-700' : 'text-gray-800'}`}>{Number(row.amount) > 0 ? '+' : ''}{money(row.amount)}</span> },
  ]

  return (
    <main className="space-y-5 px-2 py-3 sm:px-4">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#f45116]">Tài chính</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-800">Quản lý ví & rút tiền</h1>
        <p className="mt-1 text-sm text-gray-500">Ví Owner dùng chung số dư và lịch sử với mục Thanh toán & Ví trong Cài đặt tài khoản.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <p className="rounded-xl border bg-white p-5 text-sm text-gray-500">Đang tải số dư…</p> : error && !wallet ? (
        <section className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-600">Không tải được dữ liệu ví.</p><button className="mt-3 rounded-lg bg-[#F45116] px-4 py-2 text-sm font-bold text-white" onClick={() => { setLoading(true); load() }} type="button">Thử lại</button></section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl bg-[#F45116] p-5 text-white"><p className="text-sm text-white/80">Số dư khả dụng</p><p className="mt-2 text-2xl font-extrabold">{money(wallet?.availableBalance)}</p><p className="mt-2 text-xs text-white/80">Có thể dùng để thuê hoặc yêu cầu rút.</p></article>
            <article className="rounded-xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-sm text-emerald-800">Tổng thu nhập cho thuê</p><p className="mt-2 text-2xl font-extrabold text-emerald-700">{money(wallet?.totalEarnings)}</p><p className="mt-2 text-xs text-emerald-800/70">Đơn đã thanh toán và hoàn tất.</p></article>
            <article className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Đã rút thành công</p><p className="mt-2 text-2xl font-extrabold text-gray-800">{money(wallet?.withdrawnAmount)}</p></article>
            <article className="rounded-xl border border-amber-100 bg-amber-50 p-5"><p className="text-sm text-amber-800">Yêu cầu đang chờ</p><p className="mt-2 text-2xl font-extrabold text-amber-700">{money(wallet?.pendingWithdrawals)}</p><p className="mt-2 text-xs text-amber-800/70">Đã trừ khỏi số dư khả dụng trong khi chờ xử lý.</p></article>
          </section>

          <form onSubmit={withdraw} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-bold text-gray-800">Tạo yêu cầu rút tiền</h2><p className="mt-1 text-xs leading-5 text-gray-500">Yêu cầu được lưu ở trạng thái chờ xử lý; chưa chuyển khoản ngân hàng thật.</p></div>
              <Link to="/account/settings/payments" className="text-xs font-semibold text-orange-600 hover:underline">Mở cài đặt ví →</Link>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block w-full max-w-sm text-sm font-medium text-gray-600">Số tiền muốn rút<input required type="number" min="10000" max={Math.min(50000000, Number(wallet?.availableBalance || 0))} step="10000" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3" /></label>
              <button disabled={saving || !Number(amount) || Number(amount) > Number(wallet?.availableBalance || 0)} className="rounded-lg bg-[#F45116] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Đang gửi…' : 'Gửi yêu cầu rút'}</button>
              <span className="text-xs text-gray-400">Tối đa {money(wallet?.availableBalance)}</span>
            </div>
          </form>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-bold text-gray-800">Giao dịch ví Owner</h2><p className="mt-1 text-xs text-gray-500">Thu nhập và yêu cầu rút cũng xuất hiện trong lịch sử ví tài khoản.</p></div><Link to="/owner/transactions" className="text-xs font-semibold text-orange-600 hover:underline">Xem toàn bộ giao dịch →</Link></div>
            <DataTable columns={columns} rows={transactions} rowKey={(row) => row.id} loading={loading} emptyMessage="Chưa có giao dịch thu nhập hoặc rút tiền." searchable searchPlaceholder="Tìm giao dịch…" pageSize={6} />
          </section>
        </>
      )}
    </main>
  )
}
