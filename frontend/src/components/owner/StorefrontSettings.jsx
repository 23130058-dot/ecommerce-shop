import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOwnerStorefront, saveOwnerStorefront } from '../../services/ownerApi.js'
import { showToast } from '../../services/toast.js'

export default function StorefrontSettings() {
  const [form, setForm] = useState({ storeName: '', description: '', city: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { getOwnerStorefront().then(setForm).catch((e) => setError(e.message)).finally(() => setLoading(false)) }, [])
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }))
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try { setForm(await saveOwnerStorefront(form)); showToast('Đã lưu thông tin gian hàng.', 'success') }
    catch (e) { setError(e.message); showToast(e.message, 'error') }
    finally { setSaving(false) }
  }
  return <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#ff5500]">Hồ sơ cửa hàng</p><h1 className="mt-1 text-2xl font-extrabold">Gian hàng của tôi</h1><p className="mt-2 text-sm text-gray-500">Thông tin này xuất hiện cùng thiết bị đang được duyệt và hiển thị công khai.</p></div><Link to="/stores" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-[#ff5500]">Xem gian hàng</Link></div>
    {loading ? <p className="mt-6 text-sm text-gray-500">Đang tải…</p> : <form onSubmit={save} className="mt-6 max-w-2xl space-y-4">
      <label className="block text-sm font-semibold text-gray-700">Tên gian hàng<input required maxLength={160} name="storeName" value={form.storeName || ''} onChange={change} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 font-normal outline-none focus:border-orange-400" placeholder="Ví dụ: Nhung Camera Studio" /></label>
      <label className="block text-sm font-semibold text-gray-700">Giới thiệu<textarea maxLength={2000} rows={4} name="description" value={form.description || ''} onChange={change} className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 font-normal outline-none focus:border-orange-400" placeholder="Giới thiệu thiết bị và dịch vụ của bạn…" /></label>
      <label className="block text-sm font-semibold text-gray-700">Thành phố<input maxLength={120} name="city" value={form.city || ''} onChange={change} className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 font-normal outline-none focus:border-orange-400" placeholder="TP. Hồ Chí Minh" /></label>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="rounded-lg bg-[#ff5500] px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu gian hàng'}</button>
    </form>}
  </section>
}
