import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOwnerTransactions, getOwnerWallet, requestOwnerWithdrawal } from '../../services/ownerApi.js'
import { showToast } from '../../services/toast.js'

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const StatusPill = ({ status }) => {
  const look = status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700'
    : status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'
  const labels = { COMPLETED: 'Hoàn tất', FAILED: 'Thất bại', PENDING: 'Đang chờ xử lý', PROCESSING: 'Đang xử lý', VERIFYING: 'Đang xác minh' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${look}`}>{labels[status] || status}</span>
}

export default function Wallet() {
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [walletData, transactionData] = await Promise.all([getOwnerWallet(), getOwnerTransactions()])
      setWallet(walletData)
      setTransactions(Array.isArray(transactionData) ? transactionData : [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const askWithdrawal = (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isInteger(value) || value <= 0) {
      setError('Nhập số tiền nguyên dương cần rút.')
      return
    }
    if (value > Number(wallet?.availableBalance || 0)) {
      setError('Số dư khả dụng không đủ cho yêu cầu này.')
      return
    }
    setError('')
    setConfirmOpen(true)
  }

  const confirmWithdrawal = async () => {
    setSaving(true)
    setError('')
    try {
      const updatedWallet = await requestOwnerWithdrawal({ amount: Number(amount) })
      setWallet(updatedWallet)
      setConfirmOpen(false)
      setAmount('')
      showToast(`Đã trừ ${money(amount)} khỏi số dư ví.`, 'success')
      await load()
    } catch (requestError) {
      setConfirmOpen(false)
      setError(requestError.message)
      showToast(requestError.message, 'error')
      await load()
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: 'Thu nhập cho thuê', value: wallet?.totalEarnings, caption: 'Đơn đã thanh toán và hoàn tất', tone: 'emerald' },
    { label: 'Tổng đã rút', value: wallet?.withdrawnAmount, caption: 'Đã trừ khỏi ví LensRent', tone: 'slate' },
  ]

  return <main className="space-y-6 px-2 py-3 sm:px-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f45116]">Tài chính Owner</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Ví LensRent</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Theo dõi thu nhập, số dư khả dụng và các lần rút tiền.</p></div>
      <Link to="/owner/transactions" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">Lịch sử giao dịch →</Link>
    </header>

    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

    {loading && !wallet ? <div className="animate-pulse rounded-3xl bg-slate-100 p-10 text-sm text-slate-500">Đang tải dữ liệu ví…</div> : !wallet ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-600">Không tải được dữ liệu ví.</p><button className="mt-4 rounded-lg bg-[#f45116] px-4 py-2.5 text-sm font-bold text-white" onClick={() => { setLoading(true); load() }} type="button">Thử tải lại</button></section>
    ) : <>
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="absolute -right-12 -top-24 -z-10 size-72 rounded-full border-[34px] border-white/[0.04]" />
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-white/70"><span className="flex size-8 items-center justify-center rounded-lg bg-white/10">₫</span> SỐ DƯ KHẢ DỤNG</p><p className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">{money(wallet.availableBalance)}</p><p className="mt-2 text-sm text-white/60">Số dư có thể dùng để rút hoặc thanh toán.</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 lg:min-w-60"><p className="text-xs font-semibold text-white/55">Tổng đã rút</p><p className="mt-1.5 text-2xl font-bold">{money(wallet.withdrawnAmount)}</p><p className="mt-1 text-xs leading-5 text-white/50">Đã trừ khỏi số dư ví.</p></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {stats.map((item) => <article className={`rounded-2xl border p-4 sm:p-5 ${item.tone === 'emerald' ? 'border-emerald-100 bg-emerald-50/70' : item.tone === 'amber' ? 'border-amber-100 bg-amber-50/70' : 'border-slate-200 bg-white'}`} key={item.label}><p className="text-sm font-medium text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{money(item.value)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.caption}</p></article>)}
      </section>

      <section className="max-w-2xl">
        <form onSubmit={askWithdrawal} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-[#f45116]">↗</span><div><h2 className="font-bold text-slate-900">Rút tiền khỏi ví</h2><p className="mt-1 text-sm leading-6 text-slate-500">Nhập số tiền cần trừ khỏi số dư khả dụng.</p></div></div>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Số tiền muốn rút<div className="mt-2 flex items-center rounded-xl border border-slate-200 px-3 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-500/10"><input className="h-12 min-w-0 flex-1 border-0 bg-transparent text-lg font-bold outline-none focus:ring-0" required inputMode="numeric" max={Number(wallet.availableBalance || 0)} min="1" onChange={(event) => setAmount(event.target.value)} step="1" type="number" value={amount} disabled={saving} /><span className="text-sm font-semibold text-slate-400">VND</span></div></label>
          <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500"><span>Nhập số nguyên dương</span><span>Khả dụng: <b className="text-slate-700">{money(wallet.availableBalance)}</b></span></div>
          <button disabled={saving || !Number(amount) || Number(amount) > Number(wallet.availableBalance)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f45116] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50" type="submit">Rút tiền <span aria-hidden="true">→</span></button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-bold text-slate-900">Lịch sử ví Owner</h2><p className="mt-1 text-xs text-slate-500">Thu nhập và các lệnh rút gần đây.</p></div><span className="text-xs text-slate-400">{transactions.length} giao dịch</span></div>
        {!transactions.length ? <div className="flex flex-col items-center px-5 py-12 text-center"><span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">↔</span><p className="mt-3 text-sm font-semibold text-slate-700">Chưa có giao dịch</p><p className="mt-1 text-xs text-slate-400">Thu nhập và các lần rút sẽ xuất hiện tại đây.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3 sm:px-6">Giao dịch</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Số tiền</th></tr></thead><tbody className="divide-y divide-slate-100">{transactions.map((row) => <tr className="transition hover:bg-slate-50/70" key={row.id}><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className={`flex size-9 items-center justify-center rounded-xl ${row.type === 'WITHDRAWAL' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{row.type === 'WITHDRAWAL' ? '↗' : '↓'}</span><div><p className="font-semibold text-slate-800">{row.title}</p><p className="mt-0.5 max-w-[340px] truncate text-xs text-slate-500">{row.subtitle || '—'}</p></div></div></td><td className="px-4 py-4 text-xs text-slate-500">{row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : '—'}</td><td className="px-4 py-4"><StatusPill status={row.status} /></td><td className={`px-4 py-4 text-right font-bold tabular-nums ${Number(row.amount) < 0 ? 'text-slate-800' : 'text-emerald-700'}`}>{Number(row.amount) > 0 ? '+' : ''}{money(row.amount)}</td></tr>)}</tbody></table></div>}
      </section>
    </>}

    {confirmOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setConfirmOpen(false) }}><section aria-labelledby="owner-withdraw-confirm-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog"><div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-xl text-[#ed4b0a]">↗</div><h2 className="mt-4 text-lg font-bold text-slate-900" id="owner-withdraw-confirm-title">Xác nhận rút tiền</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn muốn trừ <b className="text-slate-900">{money(amount)}</b> khỏi số dư ví LensRent?</p><p className="mt-2 text-xs leading-5 text-slate-500">Số dư sau khi rút: {money(Number(wallet?.availableBalance || 0) - Number(amount))}.</p><div className="mt-6 flex justify-end gap-3"><button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={saving} onClick={() => setConfirmOpen(false)} type="button">Để sau</button><button className="rounded-xl bg-[#f45116] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50" disabled={saving} onClick={confirmWithdrawal} type="button">{saving ? 'Đang xử lý…' : 'Đồng ý rút'}</button></div></section></div>}
  </main>
}
