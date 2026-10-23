import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import avatar from '../assets/lensrent/avatar.png'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { changeAccountPassword, getAccountProfile, updateAccountProfile, uploadAccountAvatar } from '../services/accountApi.js'
import { API_BASE_URL, getStoredAuth, updateStoredUser } from '../services/authApi.js'
import { getWorkspacePreference, saveWorkspacePreference } from '../services/workspacePreference.js'

const settingsTabs = [
  { key: 'profile', path: '/account/settings', label: 'Hồ sơ cá nhân', icon: 'user' },
  { key: 'security', path: '/account/settings/security', label: 'Bảo mật', icon: 'shield' },
  { key: 'payments', path: '/account/settings/payments', label: 'Thanh toán & Ví', icon: 'wallet' },
  { key: 'notifications', path: '/account/settings/notifications', label: 'Thông báo', icon: 'bell' },
]

const iconShapes = {
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.2 3.2-5 7-5s6.3 1.8 7 5" /></>,
  shield: <><path d="M12 3 19 6v5c0 4.6-2.8 8-7 10-4.2-2-7-5.4-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5v-11Z" /><path d="M4 7h13a3 3 0 0 1 3 3v1h-5a2 2 0 0 0 0 4h5v2" /><path d="M15 13h.01" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  home: <><path d="m3 10 9-7 9 7v10h-6v-6H9v6H3V10Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  heart: <><path d="M20.8 8.8c0 4.4-8.8 10-8.8 10s-8.8-5.6-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z" /></>,
  star: <><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 3Z" /></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.4 8.4 0 0 1-3.6-.8L4 20l1.1-3.3A7.1 7.1 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-1 .9-2 1.1-2 2.9M12 17h.01" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.2 1.9-1.8 3.1-2.2-.6a8 8 0 0 1-1.8 1l-.5 2.2h-3.6l-.5-2.2a8 8 0 0 1-1.8-1l-2.2.6-1.8-3.1 1.3-1.9a8 8 0 0 1 0-2.1l-1.3-1.8 1.8-3.2 2.2.6a8 8 0 0 1 1.8-1l.5-2.1h3.6l.5 2.1a8 8 0 0 1 1.8 1l2.2-.6 1.8 3.2-1.3 1.8a8 8 0 0 1 0 2.1Z" transform="translate(-1 -1) scale(1.08)" /></>,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3.2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M5 15v4h14v-4" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18m-14 5h4" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sparkles: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
}

function Icon({ name, size = 18, className = '' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width={size}>
      {iconShapes[name] || iconShapes.user}
    </svg>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required = false, helper, endAdornment, minLength, maxLength }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}{required && <span className="text-orange-600">*</span>}
      </span>
      <span className="relative flex items-center">
        <input
          className={`h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 ${endAdornment ? 'pr-28' : ''}`}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          type={type}
          value={value}
        />
        {endAdornment}
      </span>
      {helper && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-orange-500' : 'bg-slate-300'}`}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function SaveActions({ onCancel, onSave, saveLabel = 'Lưu thay đổi' }) {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
      <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" onClick={onCancel} type="button">Hủy</button>
      <button className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-500/20" onClick={onSave} type="button">{saveLabel}</button>
    </div>
  )
}

function SectionCard({ title, description, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-5">
          {title && <h2 className="text-base font-bold text-slate-900">{title}</h2>}
          {description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

function profileFormValues(profile) {
  return {
    fullName: profile.fullName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    birthday: profile.birthday || '',
    occupation: profile.occupation || '',
    bio: profile.bio || '',
    address: profile.address || '',
    district: profile.district || '',
    city: profile.city || '',
  }
}

function avatarSource(avatarUrl) {
  if (!avatarUrl) return avatar
  return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`
}

function ProfileTab({ notify, profile, onProfileUpdated }) {
  const [values, setValues] = useState(() => profileFormValues(profile))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(avatarSource(profile.avatarUrl))

  const change = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }))

  const save = async (event) => {
    event?.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateAccountProfile({ ...values, birthday: values.birthday || null })
      onProfileUpdated(updated)
      notify('Đã lưu thông tin hồ sơ')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Vui lòng chọn ảnh JPG hoặc PNG có dung lượng tối đa 5 MB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const updated = await uploadAccountAvatar(file)
      onProfileUpdated(updated)
      setPhoto(avatarSource(updated.avatarUrl))
      notify('Đã cập nhật ảnh đại diện')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]" onSubmit={save}>
      <div className="space-y-5">
        <SectionCard title="Thông tin cá nhân" description="Cập nhật thông tin để chủ thiết bị có thể nhận diện bạn khi xác nhận đơn thuê.">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <img alt="Ảnh đại diện" className="size-[72px] rounded-full border-2 border-white object-cover shadow ring-1 ring-slate-200" src={photo} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">Ảnh đại diện</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Ảnh JPG hoặc PNG, dung lượng tối đa 5MB.</p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Icon name="upload" size={16} /> {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
              <input accept="image/png,image/jpeg" className="sr-only" onChange={pickPhoto} type="file" />
            </label>
          </div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Họ và tên" onChange={change('fullName')} required value={values.fullName} />
            <Field label="Ngày sinh" onChange={change('birthday')} type="date" value={values.birthday} />
            <Field label="Địa chỉ Email" onChange={change('email')} required type="email" value={values.email} />
            <Field label="Số điện thoại" onChange={change('phone')} value={values.phone} />
            <Field label="Nghề nghiệp / Vai trò" onChange={change('occupation')} value={values.occupation} />
            <label className="block min-w-0 sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Giới thiệu ngắn</span>
              <textarea className="min-h-[90px] w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" maxLength={240} onChange={change('bio')} value={values.bio} />
              <span className="mt-1 block text-right text-xs text-slate-400">{values.bio.length}/240 ký tự</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Địa chỉ nhận thiết bị" description="Địa chỉ này được dùng làm địa chỉ nhận thiết bị mặc định khi đặt thuê.">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Địa chỉ" onChange={change('address')} value={values.address} />
            <Field label="Quận / Huyện" onChange={change('district')} value={values.district} />
            <Field label="Tỉnh / Thành phố" onChange={change('city')} value={values.city} />
          </div>
        </SectionCard>
        {error && <p aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" onClick={() => { setValues(profileFormValues(profile)); setError('') }} type="button">Hủy</button>
          <button className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || uploading} type="submit">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </div>

      <aside className="space-y-5">
        <SectionCard title="Thông tin liên hệ" description="Thông tin bạn đã lưu trong hồ sơ.">
          <div className="space-y-4">
            <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all text-sm font-semibold text-slate-800">{values.email || 'Chưa cập nhật'}</p></div>
            <div><p className="text-xs text-slate-500">Điện thoại</p><p className="mt-1 text-sm font-semibold text-slate-800">{values.phone || 'Chưa cập nhật'}</p></div>
            <div><p className="text-xs text-slate-500">Địa chỉ nhận thiết bị</p><p className="mt-1 text-sm font-semibold text-slate-800">{[values.address, values.district, values.city].filter(Boolean).join(', ') || 'Chưa cập nhật'}</p></div>
          </div>
        </SectionCard>

        <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600"><Icon name="help" size={18} /></span>
            <div><p className="text-sm font-semibold text-slate-800">Cần trợ giúp?</p><p className="mt-1 text-xs leading-5 text-slate-500">Liên hệ đội ngũ LensRent nếu bạn cần hỗ trợ tài khoản.</p><a className="mt-2 inline-block text-xs font-bold text-orange-600 hover:underline" href="mailto:support@lensrent.vn">support@lensrent.vn</a></div>
          </div>
        </div>
      </aside>
    </form>
  )
}

function SecurityTab({ notify }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const savePassword = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setSaving(true)
    try {
      await changeAccountPassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      notify('Đã cập nhật mật khẩu')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={savePassword}>
        <SectionCard title="Mật khẩu" description="Nhập mật khẩu hiện tại rồi chọn mật khẩu mới cho tài khoản.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mật khẩu hiện tại" onChange={(event) => setCurrentPassword(event.target.value)} required type={passwordVisible ? 'text' : 'password'} value={currentPassword} />
            <Field label="Mật khẩu mới" onChange={(event) => setNewPassword(event.target.value)} required minLength={8} maxLength={72} type={passwordVisible ? 'text' : 'password'} value={newPassword} />
            <Field label="Xác nhận mật khẩu mới" onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={72} type={passwordVisible ? 'text' : 'password'} value={confirmPassword} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs text-slate-500">Mật khẩu mới cần có từ 8 đến 72 ký tự.</p>
              <button className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
            </div>
            <button className="rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
          </div>
          {error && <p aria-live="polite" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </SectionCard>
      </form>
    </div>
  )
}

function SettingRow({ icon, title, description, trailing }) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon name={icon} size={18} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
      {trailing}
    </div>
  )
}

function PaymentsTab({ notify }) {
  const [method, setMethod] = useState('vcb')
  const [autoRefund, setAutoRefund] = useState(true)
  const [accountName, setAccountName] = useState('HOANG NAM')
  const [accountNumber, setAccountNumber] = useState('0123 456 789')
  const [bankName, setBankName] = useState('Vietcombank')

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <SectionCard title="Phương thức thanh toán" description="Chọn phương thức ưu tiên cho các khoản thanh toán và hoàn tiền.">
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentChoice active={method === 'vcb'} onClick={() => setMethod('vcb')} brand="VCB" title="Vietcombank" subtitle="•••• 6789 · Tài khoản ngân hàng" />
            <PaymentChoice active={method === 'momo'} onClick={() => setMethod('momo')} brand="M" title="Ví MoMo" subtitle="090 ••• ••67 · Ví điện tử" />
            <PaymentChoice active={method === 'techcom'} onClick={() => setMethod('techcom')} brand="TCB" title="Techcombank" subtitle="Chưa liên kết · Tài khoản ngân hàng" />
            <button className="flex min-h-[82px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50/40 hover:text-orange-700" onClick={() => notify('Bạn có thể liên kết phương thức thanh toán mới tại đây')} type="button"><Icon name="plus" size={17} /> Thêm phương thức</button>
          </div>
        </SectionCard>

        <SectionCard title="Tài khoản nhận tiền" description="Tài khoản nhận tiền hoàn cọc và khoản thanh toán từ LensRent.">
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3.5">
            <span className="mt-0.5 text-blue-600"><Icon name="card" size={17} /></span><p className="text-xs leading-5 text-blue-800">Thông tin tài khoản chỉ được dùng để thực hiện giao dịch cho tài khoản LensRent của bạn.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngân hàng" onChange={(event) => setBankName(event.target.value)} required value={bankName} />
            <Field label="Số tài khoản" onChange={(event) => setAccountNumber(event.target.value)} required value={accountNumber} />
            <div className="sm:col-span-2"><Field label="Tên chủ tài khoản" onChange={(event) => setAccountName(event.target.value)} required value={accountName} /></div>
          </div>
          <div className="mt-5"><SaveActions onCancel={() => notify('Đã hủy các thay đổi')} onSave={() => notify('Đã lưu tài khoản nhận tiền')} /></div>
        </SectionCard>
      </div>

      <aside className="space-y-5">
        <div className="overflow-hidden rounded-xl bg-[#17191d] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/75">Tổng tiền cọc</p><Icon name="wallet" size={19} className="text-white/70" /></div>
          <p className="mt-4 text-3xl font-extrabold tracking-tight">90.000.000<span className="ml-1 text-base font-semibold">đ</span></p>
          <p className="mt-2 text-xs text-white/55">Tổng giá trị cọc đang được quản lý</p>
          <div className="mt-5 flex gap-2"><button className="flex-1 rounded-lg bg-white px-3 py-2.5 text-xs font-bold text-slate-900 transition hover:bg-orange-50" onClick={() => notify('Mở hướng dẫn nạp tiền')} type="button">Nạp tiền</button><button className="flex-1 rounded-lg border border-white/20 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/10" onClick={() => notify('Mở yêu cầu rút tiền')} type="button">Rút tiền</button></div>
        </div>
        <SectionCard title="Ví LensRent">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">Số dư khả dụng</p><p className="mt-1 text-2xl font-extrabold text-slate-900">1.250.000<span className="ml-1 text-sm">đ</span></p></div><span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon name="wallet" size={19} /></span></div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Dùng số dư để thanh toán đơn thuê nhanh hơn.</p>
          <button className="mt-4 w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => notify('Mở lịch sử giao dịch')} type="button">Lịch sử giao dịch</button>
        </SectionCard>
        <SectionCard title="Hoàn cọc tự động" description="Chuyển tiền cọc về phương thức thanh toán mặc định sau khi đơn thuê hoàn tất.">
          <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-700">Bật hoàn cọc tự động</span><Toggle checked={autoRefund} label="Bật hoàn cọc tự động" onChange={setAutoRefund} /></div>
        </SectionCard>
      </aside>
    </div>
  )
}

function PaymentChoice({ active, onClick, brand, title, subtitle }) {
  return (
    <button aria-pressed={active} className={`flex min-w-0 items-center gap-3 rounded-xl border p-3.5 text-left transition ${active ? 'border-orange-400 bg-orange-50/50 ring-2 ring-orange-100' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`} onClick={onClick} type="button">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${brand === 'M' ? 'bg-pink-100 text-pink-600' : 'bg-blue-50 text-blue-800'}`}>{brand}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{title}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{subtitle}</span></span>
      <span className={`size-4 shrink-0 rounded-full border ${active ? 'border-[5px] border-orange-500' : 'border-slate-300'}`} />
    </button>
  )
}

function NotificationsTab({ notify }) {
  const [preferences, setPreferences] = useState({
    returnReminder: true,
    orderUpdates: true,
    invoices: false,
    disputes: true,
    productIdeas: false,
    promotions: true,
    email: true,
    push: true,
  })
  const [quietHours, setQuietHours] = useState(true)
  const [from, setFrom] = useState('22:00')
  const [to, setTo] = useState('07:00')
  const toggle = (key, value) => setPreferences((current) => ({ ...current, [key]: value }))

  return (
    <div className="space-y-5">
      <SectionCard title="Kênh nhận thông báo" description="Chọn nơi LensRent có thể gửi thông tin quan trọng đến bạn.">
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingRow icon="bell" title="Thông báo trên ứng dụng" description="Cập nhật trực tiếp trên LensRent." trailing={<Toggle checked={preferences.push} label="Thông báo trên ứng dụng" onChange={(value) => toggle('push', value)} />} />
          <SettingRow icon="user" title="Email" description="Gửi thông báo đến hoangnam@gmail.com." trailing={<Toggle checked={preferences.email} label="Thông báo qua email" onChange={(value) => toggle('email', value)} />} />
        </div>
      </SectionCard>

      <SectionCard title="Đơn thuê" description="Nhận cập nhật liên quan đến việc đặt và trả thiết bị.">
        <div className="divide-y divide-slate-100">
          <NotificationRow title="Nhắc lịch trả hàng" description="Nhắc bạn trước thời gian cần trả thiết bị." checked={preferences.returnReminder} onChange={(value) => toggle('returnReminder', value)} />
          <NotificationRow title="Xác nhận và cập nhật đơn thuê" description="Thông báo khi chủ thiết bị xác nhận hoặc thay đổi đơn." checked={preferences.orderUpdates} onChange={(value) => toggle('orderUpdates', value)} />
          <NotificationRow title="Hóa đơn và thanh toán" description="Biên nhận, hoàn tiền và các giao dịch trong ví." checked={preferences.invoices} onChange={(value) => toggle('invoices', value)} />
          <NotificationRow title="Khiếu nại và tranh chấp" description="Cập nhật khi có phản hồi từ đội ngũ hỗ trợ." checked={preferences.disputes} onChange={(value) => toggle('disputes', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Gợi ý & khuyến mãi" description="Chọn nội dung LensRent gửi đến bạn theo sở thích.">
        <div className="divide-y divide-slate-100">
          <NotificationRow title="Gợi ý thiết bị phù hợp" description="Thiết bị và phụ kiện dựa trên hoạt động của bạn." checked={preferences.productIdeas} onChange={(value) => toggle('productIdeas', value)} />
          <NotificationRow title="Ưu đãi và mã giảm giá" description="Thông tin về chương trình khuyến mãi và ưu đãi mới." checked={preferences.promotions} onChange={(value) => toggle('promotions', value)} />
        </div>
      </SectionCard>

      <SectionCard title="Khung giờ im lặng" description="Trong khoảng thời gian này, thông báo không khẩn cấp sẽ được tạm ẩn.">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon name="clock" size={18} /></span><div><p className="text-sm font-semibold text-slate-800">Bật khung giờ im lặng</p><p className="mt-1 text-xs text-slate-500">Vẫn gửi thông báo về đơn thuê đang diễn ra.</p></div></div>
          <Toggle checked={quietHours} label="Bật khung giờ im lặng" onChange={setQuietHours} />
        </div>
        <div className={`grid gap-4 pt-4 sm:grid-cols-2 ${quietHours ? '' : 'opacity-50'}`}>
          <Field label="Bắt đầu" onChange={(event) => setFrom(event.target.value)} type="time" value={from} />
          <Field label="Kết thúc" onChange={(event) => setTo(event.target.value)} type="time" value={to} />
        </div>
        <div className="mt-5"><SaveActions onCancel={() => notify('Đã hủy các thay đổi')} onSave={() => notify('Đã lưu tùy chọn thông báo')} /></div>
      </SectionCard>
    </div>
  )
}

function NotificationRow({ title, description, checked, onChange }) {
  return (
    <SettingRow icon="bell" title={title} description={description} trailing={<Toggle checked={checked} label={title} onChange={onChange} />} />
  )
}

export default function AccountSettingsPage() {
  const location = useLocation()
  const auth = getStoredAuth()
  const accountRole = auth?.user?.role?.toUpperCase() || 'USER'
  const [toast, setToast] = useState('')
  const [toastTimer, setToastTimer] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [selectedWorkspace, setSelectedWorkspace] = useState(() => getWorkspacePreference(auth?.user))
  const tabKey = location.pathname.split('/')[3] || 'profile'
  const activeTab = settingsTabs.find((tab) => tab.key === tabKey) || settingsTabs[0]
  const isAdmin = accountRole === 'ADMIN'
  const ownerWorkspaceAvailable = !isAdmin
  const renterWorkspaceAvailable = !isAdmin
  const selectedWorkspaceAvailable = Boolean(selectedWorkspace) && !isAdmin
  const selectedWorkspacePath = selectedWorkspace === 'OWNER' ? '/owner' : selectedWorkspace === 'RENTER' ? '/renter' : '/'

  const selectWorkspace = (workspace) => {
    if (isAdmin) return
    setSelectedWorkspace(workspace)
    saveWorkspacePreference(auth?.user, workspace)
  }

  useEffect(() => {
    let mounted = true
    getAccountProfile()
      .then((loaded) => {
        if (!mounted) return
        setProfile(loaded)
        updateStoredUser({ fullName: loaded.fullName, email: loaded.email, phone: loaded.phone, avatarUrl: loaded.avatarUrl })
      })
      .catch((requestError) => {
        if (mounted) setProfileError(requestError.message)
      })
      .finally(() => {
        if (mounted) setProfileLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const loadProfile = async () => {
    setProfileLoading(true)
    setProfileError('')
    try {
      const loaded = await getAccountProfile()
      setProfile(loaded)
      updateStoredUser({ fullName: loaded.fullName, email: loaded.email, phone: loaded.phone, avatarUrl: loaded.avatarUrl })
    } catch (requestError) {
      setProfileError(requestError.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileUpdated = (updated) => {
    setProfile(updated)
    updateStoredUser({ fullName: updated.fullName, email: updated.email, phone: updated.phone, avatarUrl: updated.avatarUrl })
  }

  const notify = (message) => {
    setToast(message)
    if (toastTimer) window.clearTimeout(toastTimer)
    const timer = window.setTimeout(() => setToast(''), 2800)
    setToastTimer(timer)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] font-sans text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:py-9">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Link className="hover:text-orange-600" to="/">Trang chủ</Link><span>/</span><span className="font-medium text-slate-700">Cài đặt tài khoản</span></div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Thiết lập tài khoản</p><h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[30px]">Cài đặt tài khoản</h1><p className="mt-2 text-sm text-slate-500">Quản lý thông tin cá nhân, bảo mật và phương thức thanh toán.</p></div>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600" to={isAdmin ? '/admin' : selectedWorkspaceAvailable ? selectedWorkspacePath : '#workspace-selector'}><Icon name="arrow" size={16} className="rotate-180" /> {isAdmin ? 'Mở khu vực Admin' : selectedWorkspaceAvailable ? `Mở không gian ${selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'}` : 'Chọn workspace'}</Link>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-6">
          <aside className="space-y-4 lg:sticky lg:top-5">
            <section id="workspace-selector" className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <img alt="" className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" src={avatarSource(profile?.avatarUrl)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{profile?.fullName || auth?.user?.fullName || 'Tài khoản LensRent'}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Vai trò tài khoản</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">{isAdmin ? 'Admin' : 'User'}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAdmin ? 'bg-orange-50 text-orange-700' : selectedWorkspace ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      <span className={`size-1.5 rounded-full ${isAdmin ? 'bg-orange-500' : selectedWorkspace ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isAdmin ? 'Quản trị viên' : selectedWorkspace ? `${selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'} đang chọn` : 'Chưa chọn workspace'}
                    </span>
                  </div>
                </div>
              </div>

              {!isAdmin ? <div className="mt-5">
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Chọn không gian</p>
                  <span className="text-[10px] text-slate-400">Chọn một workspace</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {['OWNER', 'RENTER'].map((workspace) => {
                    const active = selectedWorkspace === workspace
                    const available = workspace === 'OWNER' ? ownerWorkspaceAvailable : renterWorkspaceAvailable
                    return <button key={workspace} type="button" onClick={() => selectWorkspace(workspace)} aria-pressed={active} className={`group min-h-[88px] rounded-xl border p-3 text-left transition ${active ? 'border-orange-300 bg-orange-50 shadow-sm ring-2 ring-orange-100' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className={`flex size-8 items-center justify-center rounded-lg text-xs font-extrabold ${active ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>{workspace === 'OWNER' ? 'O' : 'R'}</span>
                        <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${active ? 'bg-orange-500 text-white' : 'border border-slate-200 text-transparent'}`}>✓</span>
                      </span>
                      <span className="mt-2 block text-xs font-bold text-slate-800">{workspace === 'OWNER' ? 'Owner' : 'Renter'}</span>
                      <span className={`mt-0.5 block text-[10px] font-semibold ${active ? (available ? 'text-emerald-700' : 'text-slate-500') : (available ? 'text-slate-400' : 'text-slate-400')}`}>
                        {active ? 'Đang chọn' : 'Nhấn để chọn'}
                      </span>
                    </button>
                  })}
                </div>
                <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-600">{selectedWorkspace === 'OWNER' ? 'Quản lý thiết bị cho thuê, đơn hàng và doanh thu của bạn.' : selectedWorkspace === 'RENTER' ? 'Tìm thiết bị, quản lý giỏ hàng và theo dõi đơn thuê.' : 'Chọn Owner để quản lý thiết bị cho thuê hoặc Renter để tìm và thuê thiết bị.'}</p>
                {selectedWorkspaceAvailable
                  ? <Link className="mt-3 flex min-h-10 items-center justify-center rounded-lg bg-orange-500 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600" to={selectedWorkspacePath}>Mở không gian {selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'} <span aria-hidden="true" className="ml-1">→</span></Link>
                  : <span className="mt-3 block text-center text-[11px] text-slate-400">Chọn Owner hoặc Renter để mở workspace đã chọn.</span>}
              </div> : <div className="mt-4 rounded-xl bg-orange-50 px-3 py-3 text-xs leading-5 text-orange-800">Tài khoản Admin quản lý hệ thống tại khu vực quản trị.</div>}
            </section>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
              <nav aria-label="Các mục cài đặt tài khoản" className="flex min-w-max gap-1">
                {settingsTabs.map((tab) => (
                  <NavLink end={tab.key === 'profile'} key={tab.key} to={tab.path} className={({ isActive }) => `inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition sm:px-4 ${isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}><Icon name={tab.icon} size={16} />{tab.label}</NavLink>
                ))}
              </nav>
            </div>

            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-bold text-slate-900">{activeTab.label}</h2><p className="mt-1 text-sm text-slate-500">{tabKey === 'profile' ? 'Thông tin hiển thị trong tài khoản LensRent của bạn.' : tabKey === 'security' ? 'Kiểm soát quyền truy cập và bảo vệ dữ liệu cá nhân.' : tabKey === 'payments' ? 'Quản lý ví, tiền cọc và tài khoản nhận tiền.' : 'Tùy chỉnh những thông tin LensRent gửi đến bạn.'}</p></div>
            </div>

            {activeTab.key === 'profile' && (profileLoading ? <SectionCard title="Đang tải hồ sơ..." /> : profileError ? <SectionCard title="Không tải được hồ sơ"><p className="text-sm text-red-700">{profileError}</p><button className="mt-4 rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white" onClick={loadProfile} type="button">Thử lại</button></SectionCard> : <ProfileTab key={profile.id} notify={notify} profile={profile} onProfileUpdated={handleProfileUpdated} />)}
            {activeTab.key === 'security' && <SecurityTab notify={notify} />}
            {activeTab.key === 'payments' && <PaymentsTab notify={notify} />}
            {activeTab.key === 'notifications' && <NotificationsTab notify={notify} />}
          </section>
        </div>
      </main>
      <Footer />
      {toast && <div aria-live="polite" className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"><span className="flex size-5 items-center justify-center rounded-full bg-emerald-500"><Icon name="check" size={14} /></span>{toast}</div>}
    </div>
  )
}
