import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../services/authApi.js'
import { getOwnerStorefront, saveOwnerStorefront, uploadOwnerStorefrontImage } from '../../services/ownerApi.js'
import { showToast } from '../../services/toast.js'

const emptyProfile = {
  storeName: '', description: '', city: '', address: '', contactPhone: '', contactEmail: '',
  businessHours: '', facebookUrl: '', instagramUrl: '', logoUrl: '', coverImageUrl: '',
}

function mediaUrl(value) {
  if (!value) return ''
  return value.startsWith('/uploads/') ? `${API_BASE_URL}${value}` : value
}

function Field({ label, name, value, onChange, placeholder, maxLength, type = 'text' }) {
  return <label className="block text-sm font-semibold text-gray-700">{label}
    <input autoComplete="off" className="mt-1.5 h-11 w-full rounded-lg border border-gray-200 px-3 font-normal outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" maxLength={maxLength} name={name} onChange={onChange} placeholder={placeholder} required={name === 'storeName'} type={type} value={value || ''} />
  </label>
}

export default function StorefrontSettings() {
  const [form, setForm] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    getOwnerStorefront()
      .then((profile) => setForm({ ...emptyProfile, ...profile }))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }))

  const uploadImage = async (kind, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setUploading((value) => ({ ...value, [kind]: true }))
    try {
      const result = await uploadOwnerStorefrontImage(file, kind)
      const field = kind === 'logo' ? 'logoUrl' : 'coverImageUrl'
      setForm((value) => ({ ...value, [field]: result.url }))
      showToast(kind === 'logo' ? 'Đã tải logo. Nhấn Lưu gian hàng để áp dụng.' : 'Đã tải ảnh bìa. Nhấn Lưu gian hàng để áp dụng.', 'success')
    } catch (uploadError) {
      setError(uploadError.message)
      showToast(uploadError.message, 'error')
    } finally {
      setUploading((value) => ({ ...value, [kind]: false }))
    }
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      setForm({ ...emptyProfile, ...await saveOwnerStorefront(form) })
      showToast('Đã lưu thông tin gian hàng.', 'success')
    } catch (saveError) {
      setError(saveError.message)
      showToast(saveError.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-[#ff5500]">Hồ sơ cửa hàng</p><h1 className="mt-1 text-2xl font-extrabold">Gian hàng của tôi</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Tùy chỉnh diện mạo, thông tin liên hệ và giờ hoạt động của gian hàng công khai.</p></div>
      <Link to="/stores" className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-orange-300 hover:text-[#ff5500]">Xem gian hàng</Link>
    </div>
    {loading ? <p className="mt-6 text-sm text-gray-500">Đang tải…</p> : <form onSubmit={save} className="mt-6 space-y-5">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
        <div className="relative h-36 bg-gradient-to-r from-orange-100 via-orange-50 to-slate-100 sm:h-48">
          {form.coverImageUrl && <img alt="Ảnh bìa gian hàng" className="absolute inset-0 size-full object-cover" src={mediaUrl(form.coverImageUrl)} />}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-end gap-3 text-white drop-shadow sm:left-6">
            {form.logoUrl ? <img alt="Logo gian hàng" className="size-14 rounded-xl border-2 border-white bg-white object-cover shadow sm:size-16" src={mediaUrl(form.logoUrl)} /> : <span className="flex size-14 items-center justify-center rounded-xl border-2 border-white bg-white text-2xl font-extrabold text-[#ff5500] sm:size-16">{(form.storeName || 'L').slice(0, 1)}</span>}
            <span className="mb-1 text-lg font-extrabold">{form.storeName || 'Tên gian hàng'}</span>
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <ImageUpload label="Logo gian hàng" description="Ảnh vuông hiển thị cạnh tên gian hàng." kind="logo" value={form.logoUrl} busy={uploading.logo} onUpload={uploadImage} onRemove={() => setForm((value) => ({ ...value, logoUrl: '' }))} />
          <ImageUpload label="Ảnh bìa" description="Ảnh ngang ở đầu trang gian hàng." kind="cover" value={form.coverImageUrl} busy={uploading.cover} onUpload={uploadImage} onRemove={() => setForm((value) => ({ ...value, coverImageUrl: '' }))} />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2 sm:p-5">
        <h2 className="text-base font-bold text-gray-900 sm:col-span-2">Thông tin chung</h2>
        <Field label="Tên gian hàng" name="storeName" value={form.storeName} onChange={change} placeholder="Ví dụ: Nhung Camera Studio" maxLength={160} />
        <Field label="Thành phố" name="city" value={form.city} onChange={change} placeholder="TP. Hồ Chí Minh" maxLength={120} />
        <label className="block text-sm font-semibold text-gray-700 sm:col-span-2">Giới thiệu
          <textarea className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 font-normal leading-6 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" maxLength={2000} name="description" onChange={change} placeholder="Giới thiệu thiết bị, kinh nghiệm và dịch vụ của bạn…" rows={4} value={form.description || ''} />
        </label>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2 sm:p-5">
        <h2 className="text-base font-bold text-gray-900 sm:col-span-2">Liên hệ & hoạt động</h2>
        <Field label="Địa chỉ nhận thiết bị" name="address" value={form.address} onChange={change} placeholder="Số nhà, đường, quận/huyện" maxLength={300} />
        <Field label="Số điện thoại liên hệ" name="contactPhone" value={form.contactPhone} onChange={change} placeholder="09xx xxx xxx" maxLength={40} />
        <Field label="Email liên hệ" name="contactEmail" value={form.contactEmail} onChange={change} placeholder="studio@example.com" maxLength={180} type="email" />
        <Field label="Giờ hoạt động / nhận thiết bị" name="businessHours" value={form.businessHours} onChange={change} placeholder="Thứ 2–Thứ 7, 9:00–18:00" maxLength={300} />
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2 sm:p-5">
        <h2 className="text-base font-bold text-gray-900 sm:col-span-2">Mạng xã hội</h2>
        <Field label="Facebook" name="facebookUrl" value={form.facebookUrl} onChange={change} placeholder="https://facebook.com/…" maxLength={500} type="url" />
        <Field label="Instagram" name="instagramUrl" value={form.instagramUrl} onChange={change} placeholder="https://instagram.com/…" maxLength={500} type="url" />
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving || Object.values(uploading).some(Boolean)} className="rounded-lg bg-[#ff5500] px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu gian hàng'}</button>
    </form>}
  </section>
}

function ImageUpload({ label, description, kind, value, busy, onUpload, onRemove }) {
  return <div className="rounded-lg border border-gray-200 bg-white p-3">
    <div className="flex items-center gap-3">
      {value ? <img alt={label} className={`shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-cover ${kind === 'logo' ? 'size-14' : 'h-14 w-24'}`} src={mediaUrl(value)} /> : <span className={`flex shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl text-[#ff5500] ${kind === 'logo' ? 'size-14' : 'h-14 w-24'}`}>{kind === 'logo' ? '◉' : '▧'}</span>}
      <div className="min-w-0 flex-1"><p className="text-sm font-bold text-gray-800">{label}</p><p className="mt-0.5 text-xs leading-5 text-gray-500">{description} JPG/PNG, tối đa 8 MB.</p></div>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <label className="cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-orange-300 hover:text-[#ff5500]">{busy ? 'Đang tải ảnh…' : value ? 'Đổi ảnh' : 'Tải ảnh lên'}<input accept="image/jpeg,image/png" className="sr-only" disabled={busy} onChange={(event) => onUpload(kind, event)} type="file" /></label>
      {value && <button className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-red-600" onClick={onRemove} type="button">Gỡ ảnh</button>}
    </div>
  </div>
}
