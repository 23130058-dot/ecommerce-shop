import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOwnerSchedules, saveOwnerSchedule } from '../../services/ownerApi.js'
import { resolveProductImage } from '../home/productImageMap.js'

const money = (value) => Number(value || 0).toLocaleString('vi-VN')

export default function ScheduleSettings() {
  const [items, setItems] = useState([])
  const [productId, setProductId] = useState('')
  const [form, setForm] = useState({ dailyPrice: '', weekendPrice: '', depositAmount: '', available: true, blockedDates: [] })
  const [newDate, setNewDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async (keepId) => {
    setLoading(true)
    try {
      const rows = await getOwnerSchedules()
      setItems(rows || [])
      const selected = (rows || []).find((item) => String(item.productId) === String(keepId)) || rows?.[0]
      setProductId(selected ? String(selected.productId) : '')
      if (selected) setForm({ dailyPrice: selected.dailyPrice ?? '', weekendPrice: selected.weekendPrice ?? selected.dailyPrice ?? '', depositAmount: selected.depositAmount ?? '', available: selected.available, blockedDates: selected.blockedDates || [] })
      setError('')
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load('') }, [])

  const selectProduct = (id) => {
    setProductId(id)
    const selected = items.find((item) => String(item.productId) === id)
    if (selected) setForm({ dailyPrice: selected.dailyPrice ?? '', weekendPrice: selected.weekendPrice ?? selected.dailyPrice ?? '', depositAmount: selected.depositAmount ?? '', available: selected.available, blockedDates: selected.blockedDates || [] })
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setNotice('')
    try {
      await saveOwnerSchedule(productId, { ...form, dailyPrice: Number(form.dailyPrice), weekendPrice: Number(form.weekendPrice), depositAmount: Number(form.depositAmount) })
      await load(productId); setNotice('Đã lưu lịch và giá vào hệ thống.')
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const addBlockedDate = () => {
    if (!newDate || form.blockedDates.includes(newDate)) return
    setForm((current) => ({ ...current, blockedDates: [...current.blockedDates, newDate].sort() }))
    setNewDate('')
  }
  const product = items.find((item) => String(item.productId) === productId)

  return <main className="min-h-[60vh] px-2 py-3 sm:px-4">
    <div className="mb-5"><p className="text-xs text-gray-400">Quản lý cho thuê / Lịch và giá</p><h1 className="mt-2 text-2xl font-bold text-gray-800">Thiết lập lịch và giá</h1><p className="mt-1 text-sm text-gray-500">Lịch chặn và giá cuối tuần được áp dụng khi renter thanh toán.</p></div>
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    {loading ? <p className="rounded-xl border bg-white p-6 text-sm text-gray-500">Đang tải thiết bị…</p> : !items.length ? <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">Bạn chưa đăng sản phẩm nào. <Link className="text-orange-600" to="/owner/equipment/add">Đăng thiết bị</Link></div> : <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-semibold text-gray-700">Thiết bị<select value={productId} onChange={(e) => selectProduct(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm">{items.map((item) => <option key={item.productId} value={item.productId}>{item.productName}</option>)}</select></label>
        {product && <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"><img src={resolveProductImage(product.imageKey)} alt="" className="size-16 rounded bg-white object-contain"/><div><p className="font-semibold text-gray-800">{product.productName}</p><p className="mt-1 text-xs text-gray-500">Giá hiện tại: {money(product.dailyPrice)}đ/ngày</p></div></div>}
        <div className="grid gap-4 sm:grid-cols-3">{[['dailyPrice','Giá ngày thường'],['weekendPrice','Giá cuối tuần'],['depositAmount','Tiền đặt cọc']].map(([key,label]) => <label key={key} className="text-sm font-medium text-gray-600">{label}<input type="number" min="0" required value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"/></label>)}</div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} className="accent-orange-600"/> Đang nhận lịch thuê</label>
        <div><h2 className="text-sm font-bold text-gray-800">Ngày không nhận thuê</h2><div className="mt-3 flex gap-2"><input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"/><button type="button" onClick={addBlockedDate} className="rounded-lg border px-4 text-sm font-semibold">Thêm ngày</button></div><div className="mt-3 flex flex-wrap gap-2">{form.blockedDates.map((date) => <span key={date} className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs text-orange-700">{date}<button type="button" aria-label={`Xóa ngày ${date}`} onClick={() => setForm((f) => ({ ...f, blockedDates: f.blockedDates.filter((item) => item !== date) }))}>×</button></span>)}</div></div>
        <button disabled={saving} className="rounded-lg bg-[#F45116] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu thiết lập'}</button>
      </section>
      <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5"><h2 className="font-bold text-gray-800">Tóm tắt thiết lập</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Ngày thường</dt><dd>{money(form.dailyPrice)}đ</dd></div><div className="flex justify-between"><dt className="text-gray-500">Cuối tuần</dt><dd>{money(form.weekendPrice)}đ</dd></div><div className="flex justify-between"><dt className="text-gray-500">Đặt cọc</dt><dd>{money(form.depositAmount)}đ</dd></div><div className="flex justify-between"><dt className="text-gray-500">Ngày chặn</dt><dd>{form.blockedDates.length}</dd></div><div className="border-t pt-3"><dt className="text-gray-500">Trạng thái</dt><dd className={form.available ? 'mt-1 font-semibold text-emerald-600' : 'mt-1 font-semibold text-gray-500'}>{form.available ? 'Đang nhận thuê' : 'Tạm ngừng nhận thuê'}</dd></div></dl></aside>
    </form>}
  </main>
}
