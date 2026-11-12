import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAccountWallet,
  topUpAccountWallet,
  withdrawFromWallet,
} from '../../services/accountApi.js'
import { getStoredAuth } from '../../services/authApi.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`
const incomingTypes = new Set(['TOP_UP', 'OWNER_EARNING', 'RENTAL_REFUND', 'DEPOSIT_RELEASE', 'WITHDRAWAL_REFUND'])
const transactionNames = {
  TOP_UP: 'Nạp tiền', WITHDRAWAL: 'Rút tiền', WITHDRAWAL_REFUND: 'Hoàn tiền rút', OWNER_EARNING: 'Thu nhập cho thuê',
  RENTAL_PAYMENT: 'Thanh toán thuê', RENTAL_REFUND: 'Hoàn tiền thuê',
  DEPOSIT_HOLD: 'Giữ tiền cọc', DEPOSIT_RELEASE: 'Hoàn tiền cọc', DEPOSIT_DEDUCTION: 'Khấu trừ tiền cọc',
}

function StatusPill({ status }) {
  const styles = status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700'
    : status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
  const labels = { COMPLETED: 'Hoàn tất', FAILED: 'Thất bại', PENDING: 'Đang chờ xử lý', PROCESSING: 'Đang xử lý', VERIFYING: 'Đang xác minh' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{labels[status] || status}</span>
}

export default function WalletPanel({ notify = () => {} }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState('500000')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const isOwner = getStoredAuth()?.user?.role?.toUpperCase() === 'OWNER'

  const load = useCallback(async () => {
    try {
      const walletData = await getAccountWallet()
      setWallet(walletData)
      setError('')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const startTopUp = async (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isInteger(value) || value < 10000 || value > 50000000) {
      notify('Số tiền nạp phải từ 10.000đ đến 50.000.000đ.', 'error')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payment = await topUpAccountWallet({ amount: value })
      if (payment.status === 'PENDING' && payment.payUrl) {
        window.location.assign(payment.payUrl)
        return
      }
      throw new Error(payment.message || 'ZaloPay không tạo được yêu cầu thanh toán.')
    } catch (requestError) {
      setError(requestError.message)
      notify(requestError.message, 'error')
      setBusy(false)
    }
  }

  const withdraw = (event) => {
    event.preventDefault()
    const value = Number(withdrawAmount)
    if (!Number.isInteger(value) || value <= 0) {
      setError('Nhập số tiền nguyên dương cần rút.')
      return
    }
    if (value > Number(wallet?.availableBalance || 0)) {
      setError('Số dư khả dụng không đủ cho yêu cầu này.')
      return
    }
    setConfirmOpen(true)
  }

  const confirmWithdrawal = async () => {
    const value = Number(withdrawAmount)
    setBusy(true)
    setError('')
    try {
      const updatedWallet = await withdrawFromWallet({ amount: value })
      setWallet(updatedWallet)
      setWithdrawAmount('')
      setConfirmOpen(false)
      notify(`Đã trừ ${money(value)} khỏi số dư ví.`, 'success')
    } catch (requestError) {
      setConfirmOpen(false)
      setError(requestError.message)
      notify(requestError.message, 'error')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const summaryCards = [
    { label: 'Tiền cọc đang giữ', value: wallet?.heldBalance, note: 'Mở khóa khi đơn thuê được hoàn tất', tone: 'orange' },
    { label: 'Tổng đã nạp', value: wallet?.totalTopUps, note: 'Các giao dịch nạp đã xác nhận', tone: 'slate' },
    ...(isOwner ? [{ label: 'Thu nhập cho thuê', value: wallet?.totalOwnerEarnings, note: 'Đơn thuê đã thanh toán và hoàn tất', tone: 'green' }] : []),
  ]

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ed4b0a]">Tài chính cá nhân</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Ví LensRent</h2><p className="mt-1 text-sm text-slate-500">Theo dõi số dư, nạp tiền và lịch sử giao dịch tại một nơi.</p></div>
      <button className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50" disabled={loading || refreshing} onClick={() => { setRefreshing(true); load() }} type="button">{refreshing ? 'Đang cập nhật…' : '↻ Cập nhật số dư'}</button>
    </header>

    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

    <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-lg sm:p-8">
      <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-80 rounded-full border-[36px] border-white/[0.04]" />
      <div aria-hidden="true" className="absolute -bottom-32 right-28 -z-10 size-64 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div><div className="flex items-center gap-2 text-sm font-semibold text-white/70"><span className="flex size-8 items-center justify-center rounded-lg bg-white/10">₫</span> SỐ DƯ KHẢ DỤNG</div><p className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{loading ? '—' : money(wallet?.availableBalance)}</p><p className="mt-2 text-sm text-white/60">Có thể dùng thanh toán thuê hoặc rút khỏi ví LensRent.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-300" /> Ví LensRent đang hoạt động</span>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-4 text-xs text-white/65"><span>Tiền chỉ được cộng sau khi ZaloPay xác nhận</span><span>Tiền cọc được tách riêng khỏi số dư khả dụng</span></div>
    </section>

    <section className={`grid gap-3 sm:grid-cols-2 ${isOwner ? 'xl:grid-cols-3' : ''}`}>
      {summaryCards.map((item) => <article className={`rounded-2xl border p-4 sm:p-5 ${item.tone === 'orange' ? 'border-orange-100 bg-orange-50/70' : item.tone === 'green' ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-200 bg-white'}`} key={item.label}>
        <p className="text-sm font-medium text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{loading ? '—' : money(item.value)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>
      </article>)}
    </section>

    <section className="grid items-stretch gap-4 xl:grid-cols-2">
      <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={startTopUp}>
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-lg text-[#ed4b0a]">＋</span><h3 className="text-base font-bold text-slate-900">Nạp tiền qua ZaloPay</h3></div><p className="mt-2 text-sm leading-6 text-slate-500">Thanh toán bằng ZaloPay Sandbox; hệ thống xác nhận giao dịch trước khi cập nhật ví.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">SANDBOX</span></div>
        <div className="mt-5 flex flex-wrap gap-2">{[100000, 500000, 1000000].map((preset) => <button className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${Number(amount) === preset ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`} key={preset} onClick={() => setAmount(String(preset))} type="button">{money(preset)}</button>)}</div>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Số tiền muốn nạp<div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10"><input className="h-12 min-w-0 flex-1 border-0 bg-transparent text-lg font-bold outline-none focus:ring-0" inputMode="numeric" max="50000000" min="10000" onChange={(event) => setAmount(event.target.value)} step="10000" type="number" value={amount} /><span className="text-sm font-semibold text-slate-400">VND</span></div></label>
        <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f45116] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55" disabled={busy || loading} type="submit">{busy ? 'Đang tạo giao dịch…' : 'Tiếp tục với ZaloPay'} <span aria-hidden="true">→</span></button>
        <p className="mt-3 text-xs leading-5 text-slate-400">Tiền Sandbox chỉ dùng để thử nghiệm, không phải tiền thật.</p>
      </form>

      <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={withdraw}>
        <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700">↗</span><h3 className="text-base font-bold text-slate-900">Rút tiền khỏi ví</h3></div><p className="mt-2 text-sm leading-6 text-slate-500">Nhập số tiền cần trừ khỏi số dư khả dụng của bạn.</p></div></div>
        <label className="mt-5 block text-sm font-semibold text-slate-700">Số tiền muốn rút<div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10"><input className="h-12 min-w-0 flex-1 border-0 bg-transparent text-lg font-bold outline-none focus:ring-0" required inputMode="numeric" max={Number(wallet?.availableBalance || 0)} min="1" onChange={(event) => setWithdrawAmount(event.target.value)} step="1" type="number" value={withdrawAmount} disabled={busy || loading} /><span className="text-sm font-semibold text-slate-400">VND</span></div></label>
        <p className="mt-2 text-xs text-slate-500">Số dư khả dụng: <b className="text-slate-700">{money(wallet?.availableBalance)}</b></p>
        <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45" disabled={busy || loading || !Number(withdrawAmount) || Number(withdrawAmount) > Number(wallet?.availableBalance || 0)} type="submit">Rút tiền <span aria-hidden="true">→</span></button>
      </form>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h3 className="font-bold text-slate-900">Lịch sử giao dịch</h3><p className="mt-1 text-xs text-slate-500">Các giao dịch nạp, rút, thanh toán, tiền cọc và hoàn tiền gần đây.</p></div><span className="text-xs font-medium text-slate-400">Tối đa 50 giao dịch</span></div>
      {loading ? <p className="p-10 text-center text-sm text-slate-500">Đang tải lịch sử ví…</p> : !wallet?.transactions?.length ? <div className="flex flex-col items-center px-5 py-12 text-center"><span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">↔</span><p className="mt-3 text-sm font-semibold text-slate-700">Chưa có giao dịch</p><p className="mt-1 text-xs text-slate-400">Khi có giao dịch, lịch sử sẽ xuất hiện tại đây.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 sm:px-6">Giao dịch</th><th className="px-4 py-3">Ngày giờ</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Số tiền</th></tr></thead><tbody className="divide-y divide-slate-100">{wallet.transactions.map((transaction) => {
        const incoming = incomingTypes.has(transaction.type)
        return <tr className="transition hover:bg-slate-50/70" key={transaction.id}><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-base ${incoming ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{incoming ? '↓' : '↑'}</span><div><p className="font-semibold text-slate-800">{transactionNames[transaction.type] || transaction.type}</p><p className="mt-0.5 max-w-[340px] truncate text-xs text-slate-500">{transaction.description}</p></div></div></td><td className="px-4 py-4 text-xs text-slate-500">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('vi-VN') : '—'}</td><td className="px-4 py-4"><StatusPill status={transaction.status} /></td><td className={`px-4 py-4 text-right font-bold tabular-nums ${incoming ? 'text-emerald-700' : 'text-slate-800'}`}>{incoming ? '+' : '−'}{money(transaction.amount)}</td></tr>
      })}</tbody></table></div>}
    </section>
    {isOwner && <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#ed4b0a] hover:underline" to="/owner/wallet">Mở báo cáo Ví Owner <span aria-hidden="true">→</span></Link>}
    {confirmOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setConfirmOpen(false) }}><section aria-labelledby="wallet-withdraw-confirm-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog"><div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-xl text-[#ed4b0a]">↗</div><h2 className="mt-4 text-lg font-bold text-slate-900" id="wallet-withdraw-confirm-title">Xác nhận rút tiền</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn muốn trừ <b className="text-slate-900">{money(withdrawAmount)}</b> khỏi số dư ví LensRent?</p><p className="mt-2 text-xs leading-5 text-slate-500">Số dư sau khi rút: {money(Number(wallet?.availableBalance || 0) - Number(withdrawAmount))}.</p><div className="mt-6 flex justify-end gap-3"><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={busy} onClick={() => setConfirmOpen(false)} type="button">Để sau</button><button className="rounded-xl bg-[#f45116] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50" disabled={busy} onClick={confirmWithdrawal} type="button">{busy ? 'Đang xử lý…' : 'Đồng ý rút'}</button></div></section></div>}
  </div>
}
