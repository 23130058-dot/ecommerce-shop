import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import avatar from '../assets/lensrent/avatar.png'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { changeAccountPassword, confirmPhoneVerificationCode, getAccountProfile, getAccountVerification, getAccountWallet, getNotificationPreferences, requestPhoneVerificationCode, topUpAccountWallet, updateAccountProfile, updateNotificationPreferences, uploadAccountAvatar, uploadAccountVerificationDocument, withdrawAccountWallet } from '../services/accountApi.js'
import { API_BASE_URL, getStoredAuth, updateStoredUser } from '../services/authApi.js'
import { getWorkspacePreference, saveWorkspacePreference } from '../services/workspacePreference.js'

const settingsTabs = [
  { key: 'profile', path: '/account/settings', label: 'Hồ sơ cá nhân', icon: 'user' },
  { key: 'verification', path: '/account/settings/verification', label: 'Xác minh cá nhân', icon: 'check' },
  { key: 'security', path: '/account/settings/security', label: 'Đăng nhập & bảo mật', icon: 'shield' },
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
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
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

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 8 ? 1 : /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword) ? 3 : 2
  const strengthLabel = ['', 'Cần cải thiện', 'Tạm ổn', 'Khá tốt'][strength]

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={savePassword}>
        <SectionCard title="Đổi mật khẩu" description="Dùng mật khẩu hiện tại để xác nhận trước khi lưu mật khẩu mới.">
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700"><Icon name="shield" size={19} /></span>
            <div><p className="text-sm font-bold text-emerald-900">Mật khẩu bảo vệ tài khoản LensRent</p><p className="mt-1 text-xs leading-5 text-emerald-800">Thay đổi mật khẩu sẽ được lưu vào tài khoản ngay sau khi backend xác nhận.</p></div>
          </div>
          <div className="space-y-4">
            <Field label="Mật khẩu hiện tại" onChange={(event) => setCurrentPassword(event.target.value)} required type={passwordVisible ? 'text' : 'password'} value={currentPassword} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mật khẩu mới" helper="Từ 8 đến 72 ký tự." onChange={(event) => setNewPassword(event.target.value)} required minLength={8} maxLength={72} type={passwordVisible ? 'text' : 'password'} value={newPassword} />
              <Field label="Xác nhận mật khẩu mới" onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={72} type={passwordVisible ? 'text' : 'password'} value={confirmPassword} />
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">Độ an toàn mật khẩu</span><span className={strength >= 3 ? 'font-bold text-emerald-700' : 'font-semibold text-slate-500'}>{strengthLabel}</span></div>
            <div className="mt-2 grid grid-cols-3 gap-1.5" aria-hidden="true">{[1, 2, 3].map((step) => <span className={`h-1.5 rounded-full ${step <= strength ? strength === 3 ? 'bg-emerald-500' : 'bg-orange-400' : 'bg-slate-200'}`} key={step} />)}</div>
            <p className="mt-2 text-xs text-slate-500">Kết hợp chữ cái và số để khó đoán hơn.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button className="text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</button>
            <button className="rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}</button>
          </div>
          {error && <p aria-live="polite" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </SectionCard>
      </form>
      <aside className="space-y-4">
        <SectionCard title="Gợi ý bảo mật">
          <ul className="space-y-3 text-xs leading-5 text-slate-600"><li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-emerald-600" name="check" size={15} />Không dùng lại mật khẩu ở website khác.</li><li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-emerald-600" name="check" size={15} />Không chia sẻ mật khẩu hoặc mã đăng nhập.</li><li className="flex gap-2"><Icon className="mt-0.5 shrink-0 text-emerald-600" name="check" size={15} />Đổi mật khẩu nếu bạn nghi ngờ tài khoản bị truy cập.</li></ul>
        </SectionCard>
        <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4"><p className="text-sm font-bold text-orange-900">Cần hỗ trợ?</p><p className="mt-1 text-xs leading-5 text-orange-800">Nếu không thể cập nhật mật khẩu, liên hệ đội ngũ LensRent.</p><a className="mt-2 inline-block text-xs font-bold text-orange-700 hover:underline" href="mailto:support@lensrent.vn">support@lensrent.vn</a></div>
      </aside>
    </div>
  )
}

const verificationStatus = {
  NOT_SUBMITTED: { label: 'Chưa gửi', classes: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'Đang chờ duyệt', classes: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Đã xác minh', classes: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Cần gửi lại', classes: 'bg-rose-50 text-rose-700' },
}

function VerificationDocumentCard({ title, description, type, status, reviewNote, submittedAt, accept, busy, onFile }) {
  const state = verificationStatus[status] || verificationStatus.NOT_SUBMITTED
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${state.classes}`}>{state.label}</span>
      </div>
      {status === 'PENDING' && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">Giấy tờ đang được Admin xem xét. Bạn có thể tải bản mới lên nếu cần thay thế.</p>}
      {status === 'APPROVED' && submittedAt && <p className="mt-3 text-xs text-emerald-700">Đã gửi ngày {new Date(submittedAt).toLocaleDateString('vi-VN')}.</p>}
      {status === 'REJECTED' && reviewNote && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800">Ghi chú từ Admin: {reviewNote}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700">
          <Icon name="upload" size={15} /> {busy ? 'Đang tải lên…' : status === 'NOT_SUBMITTED' ? 'Chọn giấy tờ' : 'Tải bản mới lên'}
          <input accept={accept} className="sr-only" disabled={busy} onChange={(event) => onFile(type, event)} type="file" />
        </label>
        <span className="text-[11px] text-slate-400">Tối đa 3 MB</span>
      </div>
    </article>
  )
}

function VerificationTab({ notify, profile }) {
  const [verification, setVerification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState(profile?.phone || '')
  const [code, setCode] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAccountVerification()
      .then((result) => { if (active) { setVerification(result); setPhone(result.phone || profile?.phone || '') } })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [profile?.phone])

  const requestCode = async (event) => {
    event.preventDefault()
    setBusy('phone')
    setError('')
    try {
      const result = await requestPhoneVerificationCode(phone)
      setPhone(result.phone)
      setDemoCode(result.demoCode || '')
      setExpiresAt(result.expiresAt || '')
      setCode('')
      notify('Đã tạo mã xác minh mô phỏng')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy('') }
  }

  const confirmCode = async (event) => {
    event.preventDefault()
    setBusy('confirm')
    setError('')
    try {
      const result = await confirmPhoneVerificationCode({ phone, code })
      setVerification(result)
      setDemoCode('')
      setCode('')
      updateStoredUser({ phone: result.phone })
      notify('Đã xác minh số điện thoại')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy('') }
  }

  const uploadDocument = async (type, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const validType = type === 'student-card'
      ? ['image/jpeg', 'image/png'].includes(file.type)
      : ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
    if (!validType || file.size > 3 * 1024 * 1024) {
      setError(type === 'student-card' ? 'Thẻ sinh viên cần là ảnh JPG/PNG tối đa 3 MB.' : 'Căn cước cần là JPG, PNG hoặc PDF tối đa 3 MB.')
      return
    }
    setBusy(type)
    setError('')
    try {
      const result = await uploadAccountVerificationDocument(type, file)
      setVerification(result)
      notify('Đã gửi giấy tờ cho Admin duyệt')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy('') }
  }

  const phoneVerified = Boolean(verification?.phoneVerified)
  return (
    <div className="space-y-5">
      <SectionCard title="Xác minh số điện thoại" description="Xác minh số điện thoại giúp người thuê và chủ thiết bị liên hệ khi cần. Mã OTP hiện chạy mô phỏng trong đồ án, chưa gửi SMS thật.">
        {loading ? <p className="text-sm text-slate-500">Đang tải trạng thái xác minh…</p> : <>
          <div className={`mb-4 flex items-center gap-3 rounded-xl p-4 ${phoneVerified ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}>
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${phoneVerified ? 'bg-white text-emerald-600' : 'bg-white text-slate-500'}`}><Icon name={phoneVerified ? 'check' : 'shield'} size={19} /></span>
            <div><p className="text-sm font-bold">{phoneVerified ? 'Số điện thoại đã xác minh' : 'Số điện thoại chưa xác minh'}</p><p className="mt-0.5 text-xs">{phoneVerified ? verification.phone : 'Nhập số điện thoại để tạo mã xác minh.'}</p></div>
          </div>
          <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={requestCode}>
            <Field label="Số điện thoại" onChange={(event) => setPhone(event.target.value)} placeholder="Ví dụ: 0912345678" value={phone} required />
            <button className="h-11 rounded-lg border border-orange-200 px-4 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60" disabled={busy === 'phone'} type="submit">{busy === 'phone' ? 'Đang tạo mã…' : 'Tạo mã OTP mô phỏng'}</button>
          </form>
          {demoCode && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4" role="status"><p className="text-xs font-bold uppercase tracking-wide text-orange-800">Mã test của đồ án</p><p className="mt-1 font-mono text-2xl font-extrabold tracking-[0.25em] text-orange-700">{demoCode}</p><p className="mt-1 text-xs leading-5 text-orange-800">Mã chỉ hiển thị để thử nghiệm, hết hạn sau 5 phút{expiresAt ? ` (${new Date(expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})` : ''}. Hệ thống chưa tích hợp nhà cung cấp SMS.</p></div>}
          {demoCode && <form className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={confirmCode}>
            <Field label="Mã xác minh 6 số" onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nhập mã OTP" value={code} required maxLength={6} />
            <button className="h-11 rounded-lg bg-[#ff5500] px-5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" disabled={busy === 'confirm' || code.length !== 6} type="submit">{busy === 'confirm' ? 'Đang xác minh…' : 'Xác minh số điện thoại'}</button>
          </form>}
        </>}
      </SectionCard>

      <SectionCard title="Xác minh giấy tờ cá nhân" description="CCCD đã được Admin duyệt là điều kiện để thuê hoặc đăng thiết bị. Thẻ sinh viên đã được duyệt giúp bạn nhận ưu đãi giảm 15% tiền thuê.">
        {loading ? <p className="text-sm text-slate-500">Đang tải trạng thái giấy tờ…</p> : <div className="grid gap-4 xl:grid-cols-2">
          <VerificationDocumentCard title="Thẻ học sinh / sinh viên" description="Gửi ảnh thẻ còn hiệu lực để nhận ưu đãi giảm 15% trên tiền thuê sau khi Admin duyệt. Không giảm tiền cọc." type="student-card" status={verification?.studentCardStatus} reviewNote={verification?.studentCardReviewNote} submittedAt={verification?.studentCardSubmittedAt} accept="image/png,image/jpeg" busy={busy === 'student-card'} onFile={uploadDocument} />
          <VerificationDocumentCard title="Căn cước công dân (bắt buộc)" description="Gửi ảnh JPG/PNG hoặc PDF. Cần Admin duyệt CCCD trước khi đặt thuê hoặc đăng thiết bị Owner." type="identity" status={verification?.identityStatus} reviewNote={verification?.identityReviewNote} submittedAt={verification?.identitySubmittedAt} accept="image/png,image/jpeg,application/pdf" busy={busy === 'identity'} onFile={uploadDocument} />
        </div>}
        <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs leading-5 text-slate-500">Đây là luồng xác minh phục vụ đồ án. Hiện chưa kết nối cơ quan xác thực, nhà cung cấp SMS hoặc hệ thống kiểm tra giấy tờ tự động; không tải giấy tờ thật nếu bạn không muốn chia sẻ với Admin dự án.</p>
      </SectionCard>
      {error && <p aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
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
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadCounter, setReloadCounter] = useState(0)
  const [busy, setBusy] = useState('')
  const [topUpAmount, setTopUpAmount] = useState('500000')
  const [topUpResult, setTopUpResult] = useState('SUCCESS')
  const [withdrawAmount, setWithdrawAmount] = useState('100000')
  const [withdrawResult, setWithdrawResult] = useState('SUCCESS')

  useEffect(() => {
    let active = true
    getAccountWallet().then((data) => { if (active) { setWallet(data); setLoadError('') } })
      .catch((error) => { if (active) { setLoadError(error.message); notify(error.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadCounter])

  const runWalletAction = async (action, amount, simulatedResult) => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 10000 || value > 50000000) {
      notify('Số tiền phải từ 10.000đ đến 50.000.000đ.', 'error')
      return
    }
    setBusy(action)
    try {
      const result = action === 'topup'
        ? await topUpAccountWallet({ amount: value, simulatedResult })
        : await withdrawAccountWallet({ amount: value, simulatedResult })
      setWallet(result)
      const outcome = result.transactions?.[0]?.status
      notify(outcome === 'PENDING' ? 'Giao dịch đang chờ xử lý; số dư chưa thay đổi.' : outcome === 'FAILED' ? 'Giao dịch mô phỏng thất bại; số dư được giữ nguyên.' : action === 'topup' ? 'Nạp tiền mô phỏng thành công.' : 'Rút tiền mô phỏng thành công.')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setBusy('')
    }
  }

  const transactionLabels = {
    TOP_UP: 'Nạp tiền', WITHDRAWAL: 'Rút tiền', OWNER_EARNING: 'Thu nhập cho thuê', RENTAL_PAYMENT: 'Thanh toán thuê',
    RENTAL_REFUND: 'Hoàn tiền đơn thuê', DEPOSIT_HOLD: 'Giữ tiền cọc',
    DEPOSIT_RELEASE: 'Hoàn tiền cọc', DEPOSIT_DEDUCTION: 'Khấu trừ tiền cọc',
  }
  const moneyText = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

  if (!loading && !wallet) return <SectionCard title="Không tải được ví LensRent"><p className="text-sm text-red-700">{loadError || 'Không thể lấy số dư ví.'}</p><button className="mt-4 rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white" onClick={() => { setLoading(true); setReloadCounter((value) => value + 1) }} type="button">Thử lại</button></SectionCard>

  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl bg-slate-900 p-5 text-white"><p className="text-xs font-semibold text-white/65">Số dư khả dụng</p><p className="mt-2 text-2xl font-extrabold">{loading ? '…' : moneyText(wallet?.availableBalance)}</p><p className="mt-1 text-xs text-white/55">Dùng để thanh toán đơn thuê hoặc rút mô phỏng.</p></div>
      <div className="rounded-xl border border-orange-100 bg-orange-50 p-5"><p className="text-xs font-semibold text-orange-800">Tiền cọc đang giữ</p><p className="mt-2 text-2xl font-extrabold text-orange-700">{loading ? '…' : moneyText(wallet?.heldBalance)}</p><p className="mt-1 text-xs text-orange-800/70">Được mở khóa khi thiết bị được xác nhận trả.</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-slate-500">Đã nạp thành công</p><p className="mt-2 text-2xl font-extrabold text-slate-900">{loading ? '…' : moneyText(wallet?.totalTopUps)}</p><p className="mt-1 text-xs text-slate-500">Tổng giao dịch nạp đã hoàn tất.</p></div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-xs font-semibold text-emerald-800">Thu nhập Owner</p><p className="mt-2 text-2xl font-extrabold text-emerald-700">{loading ? '…' : moneyText(wallet?.totalOwnerEarnings)}</p><p className="mt-1 text-xs text-emerald-800/70">Thu nhập từ các đơn đã thanh toán và hoàn tất.</p></div>
    </div>

    <div className="grid items-start gap-5 xl:grid-cols-2">
      <SectionCard title="Nạp ví mô phỏng" description="Chọn kết quả giả lập để kiểm tra luồng ví; không phát sinh giao dịch tiền thật.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Số tiền nạp<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" max="50000000" min="10000" onChange={(event) => setTopUpAmount(event.target.value)} step="10000" type="number" value={topUpAmount} /></label>
          <label className="block text-sm font-medium text-slate-700">Kết quả giả lập<select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500" onChange={(event) => setTopUpResult(event.target.value)} value={topUpResult}><option value="SUCCESS">Thành công</option><option value="PENDING">Đang chờ</option><option value="FAILED">Thất bại</option></select></label>
        </div>
        <button className="mt-4 w-full rounded-lg bg-[#ff5500] px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60" disabled={Boolean(busy) || loading} onClick={() => runWalletAction('topup', topUpAmount, topUpResult)} type="button">{busy === 'topup' ? 'Đang ghi nhận…' : 'Thực hiện nạp thử'}</button>
        <p className="mt-3 text-xs leading-5 text-slate-500">Chỉ giao dịch “Thành công” mới cộng số dư. “Đang chờ” và “Thất bại” được lưu lịch sử nhưng không cộng tiền.</p>
      </SectionCard>

      <SectionCard title="Rút tiền mô phỏng" description="Kiểm tra kết quả thành công hoặc thất bại. Đồ án chưa kết nối ngân hàng thật.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Số tiền rút<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" max="50000000" min="10000" onChange={(event) => setWithdrawAmount(event.target.value)} step="10000" type="number" value={withdrawAmount} /></label>
          <label className="block text-sm font-medium text-slate-700">Kết quả giả lập<select className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-500" onChange={(event) => setWithdrawResult(event.target.value)} value={withdrawResult}><option value="SUCCESS">Thành công</option><option value="FAILED">Thất bại</option></select></label>
        </div>
        <button className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60" disabled={Boolean(busy) || loading} onClick={() => runWalletAction('withdraw', withdrawAmount, withdrawResult)} type="button">{busy === 'withdraw' ? 'Đang ghi nhận…' : 'Thực hiện rút thử'}</button>
        <p className="mt-3 text-xs leading-5 text-slate-500">Rút thành công cần đủ số dư khả dụng. Tiền cọc đang giữ không thể rút.</p>
      </SectionCard>
    </div>

    <SectionCard title="Lịch sử giao dịch ví" description="Các giao dịch gần đây được lưu trong cơ sở dữ liệu.">
      {loading ? <p className="py-6 text-center text-sm text-slate-500">Đang tải lịch sử ví…</p> : !wallet?.transactions?.length ? <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Chưa có giao dịch. Hãy nạp thử để bắt đầu.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="py-3 pr-4">Giao dịch</th><th className="py-3 pr-4">Thời gian</th><th className="py-3 pr-4">Trạng thái</th><th className="py-3 text-right">Số tiền</th></tr></thead><tbody>{wallet.transactions.map((transaction) => {
        const incoming = ['TOP_UP', 'OWNER_EARNING', 'RENTAL_REFUND', 'DEPOSIT_RELEASE'].includes(transaction.type)
        const statusLabel = transaction.status === 'COMPLETED' ? 'Thành công' : transaction.status === 'PENDING' ? 'Đang chờ' : 'Thất bại'
        return <tr className="border-b border-slate-50 last:border-0" key={transaction.id}><td className="py-3 pr-4"><p className="font-semibold text-slate-800">{transactionLabels[transaction.type] || transaction.type}</p><p className="mt-0.5 text-xs text-slate-500">{transaction.description}</p></td><td className="py-3 pr-4 text-xs text-slate-500">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString('vi-VN') : '—'}</td><td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${transaction.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : transaction.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{statusLabel}</span></td><td className={`py-3 text-right font-bold ${incoming ? 'text-emerald-700' : 'text-slate-800'}`}>{incoming ? '+' : '-'}{moneyText(transaction.amount)}</td></tr>
      })}</tbody></table></div>}
    </SectionCard>
    <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">Ví LensRent hiện là ví nội bộ mô phỏng cho đồ án. Muốn thu hoặc chuyển tiền thật cần tích hợp cổng thanh toán/ngân hàng, xác minh chữ ký webhook và chỉ ghi nhận giao dịch sau khi đối tác xác nhận.</p>
  </div>
}

const defaultNotificationPreferences = {
  inAppEnabled: true, emailEnabled: true, returnReminders: true, orderUpdates: true,
  paymentUpdates: true, disputes: true, productRecommendations: false, promotions: false,
  quietHoursEnabled: false, quietStart: '22:00', quietEnd: '07:00',
}

function NotificationsTab({ notify }) {
  const [preferences, setPreferences] = useState(defaultNotificationPreferences)
  const [savedPreferences, setSavedPreferences] = useState(defaultNotificationPreferences)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reloadCounter, setReloadCounter] = useState(0)
  const toggle = (key, value) => setPreferences((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let active = true
    getNotificationPreferences().then((data) => {
      const normalized = { ...defaultNotificationPreferences, ...data, quietStart: data.quietStart?.slice(0, 5) || '22:00', quietEnd: data.quietEnd?.slice(0, 5) || '07:00' }
      if (active) { setPreferences(normalized); setSavedPreferences(normalized); setLoaded(true); setError('') }
    }).catch((loadError) => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadCounter])

  const save = async () => {
    setSaving(true); setError('')
    try {
      const data = await updateNotificationPreferences(preferences)
      const normalized = { ...preferences, ...data, quietStart: data.quietStart?.slice(0, 5) || preferences.quietStart, quietEnd: data.quietEnd?.slice(0, 5) || preferences.quietEnd }
      setPreferences(normalized); setSavedPreferences(normalized); notify('Đã lưu cài đặt thông báo.')
    } catch (saveError) { setError(saveError.message); notify(saveError.message, 'error') }
    finally { setSaving(false) }
  }
  const cancel = () => { setPreferences(savedPreferences); setError('') }

  if (loading) return <SectionCard title="Đang tải cài đặt thông báo…"><p className="text-sm text-slate-500">Đang lấy tùy chọn đã lưu từ backend.</p></SectionCard>
  if (!loaded) return <SectionCard title="Không tải được cài đặt thông báo"><p className="text-sm text-red-700">{error || 'Không thể lấy tùy chọn đã lưu.'}</p><button className="mt-4 rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white" onClick={() => { setLoading(true); setReloadCounter((value) => value + 1) }} type="button">Thử lại</button></SectionCard>

  return <div className="space-y-5">
    <SectionCard title="Kênh nhận thông báo" description="Tùy chọn được lưu theo tài khoản của bạn.">
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingRow icon="bell" title="Thông báo trong ứng dụng" description="Lưu thông báo trong trung tâm thông báo LensRent." trailing={<Toggle checked={preferences.inAppEnabled} label="Thông báo trong ứng dụng" onChange={(value) => toggle('inAppEnabled', value)} />} />
        <SettingRow icon="user" title="Email" description="Lưu lựa chọn nhận email tại địa chỉ tài khoản." trailing={<Toggle checked={preferences.emailEnabled} label="Thông báo email" onChange={(value) => toggle('emailEnabled', value)} />} />
      </div>
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">Hệ thống hiện chưa cấu hình dịch vụ gửi email. Các lựa chọn đã được lưu; thông báo trong ứng dụng vẫn được lưu để bạn xem lại.</p>
    </SectionCard>
    <SectionCard title="Đơn thuê & giao dịch" description="Chọn nhóm cập nhật muốn nhận.">
      <div className="divide-y divide-slate-100">
        <NotificationRow title="Nhắc lịch trả thiết bị" description="Nhắc bạn trước thời gian cần trả thiết bị." checked={preferences.returnReminders} onChange={(value) => toggle('returnReminders', value)} />
        <NotificationRow title="Xác nhận và cập nhật đơn thuê" description="Thông báo khi đơn được xác nhận, bàn giao, hủy hoặc hoàn tất." checked={preferences.orderUpdates} onChange={(value) => toggle('orderUpdates', value)} />
        <NotificationRow title="Hóa đơn và thanh toán" description="Biên nhận, hoàn tiền và giao dịch trong ví." checked={preferences.paymentUpdates} onChange={(value) => toggle('paymentUpdates', value)} />
        <NotificationRow title="Khiếu nại và tranh chấp" description="Cập nhật kết quả xử lý báo cáo và tiền cọc." checked={preferences.disputes} onChange={(value) => toggle('disputes', value)} />
      </div>
    </SectionCard>
    <SectionCard title="Gợi ý & khuyến mãi" description="Các thông báo tùy chọn không liên quan trực tiếp đến giao dịch.">
      <div className="divide-y divide-slate-100">
        <NotificationRow title="Gợi ý thiết bị phù hợp" description="Đề xuất dựa trên hoạt động tìm kiếm của bạn." checked={preferences.productRecommendations} onChange={(value) => toggle('productRecommendations', value)} />
        <NotificationRow title="Ưu đãi và mã giảm giá" description="Thông tin về chương trình khuyến mãi mới." checked={preferences.promotions} onChange={(value) => toggle('promotions', value)} />
      </div>
    </SectionCard>
    <SectionCard title="Khung giờ im lặng" description="Dùng cho gợi ý và khuyến mãi; thông báo về đơn thuê vẫn được lưu.">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon name="clock" size={18} /></span><div><p className="text-sm font-semibold text-slate-800">Bật khung giờ im lặng</p><p className="mt-1 text-xs text-slate-500">Khung giờ có thể đi qua nửa đêm.</p></div></div><Toggle checked={preferences.quietHoursEnabled} label="Bật khung giờ im lặng" onChange={(value) => toggle('quietHoursEnabled', value)} /></div>
      <div className={`grid gap-4 pt-4 sm:grid-cols-2 ${preferences.quietHoursEnabled ? '' : 'opacity-50'}`}><Field label="Bắt đầu" onChange={(event) => toggle('quietStart', event.target.value)} type="time" value={preferences.quietStart} /><Field label="Kết thúc" onChange={(event) => toggle('quietEnd', event.target.value)} type="time" value={preferences.quietEnd} /></div>
      {error && <p aria-live="polite" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5"><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" disabled={saving} onClick={cancel} type="button">Hoàn tác</button><button className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? 'Đang lưu…' : 'Lưu tùy chọn'}</button></div>
    </SectionCard>
  </div>
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
            <section id="workspace-selector" className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-orange-50/60 p-3">
                <img alt="" className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm" src={avatarSource(profile?.avatarUrl)} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 break-words text-[13px] font-bold leading-5 text-slate-900">{profile?.fullName || auth?.user?.fullName || 'Tài khoản LensRent'}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{profile?.email || auth?.user?.email || 'Tài khoản LensRent'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">{isAdmin ? 'Admin' : 'User'}</span>
                    <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isAdmin ? 'bg-orange-50 text-orange-700' : selectedWorkspace ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      <span className={`size-1.5 shrink-0 rounded-full ${isAdmin ? 'bg-orange-500' : selectedWorkspace ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className="truncate">{isAdmin ? 'Quản trị viên' : selectedWorkspace ? `${selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'} đang chọn` : 'Chưa chọn workspace'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {!isAdmin ? <div className="mt-4">
                <div className="px-1">
                  <p className="text-xs font-bold text-slate-900">Không gian làm việc</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Chọn cách bạn muốn dùng LensRent.</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {['OWNER', 'RENTER'].map((workspace) => {
                    const active = selectedWorkspace === workspace
                    const isOwner = workspace === 'OWNER'
                    const available = isOwner ? ownerWorkspaceAvailable : renterWorkspaceAvailable
                    return <button key={workspace} type="button" onClick={() => selectWorkspace(workspace)} aria-pressed={active} className={`group flex min-h-[116px] flex-col rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-1 ${active ? 'border-orange-300 bg-orange-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30'}`}>
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className={`flex size-9 items-center justify-center rounded-xl transition ${active ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-orange-600'}`}><Icon name={isOwner ? 'camera' : 'search'} size={17} /></span>
                        <span aria-hidden="true" className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition ${active ? 'bg-orange-500 text-white' : 'border border-slate-200 text-transparent'}`}>✓</span>
                      </span>
                      <span className="mt-2.5 block text-sm font-bold leading-5 text-slate-900">{isOwner ? 'Owner' : 'Renter'}</span>
                      <span className={`mt-1 flex items-center gap-1 text-[10px] font-semibold leading-4 ${active ? (available ? 'text-emerald-700' : 'text-slate-500') : 'text-slate-500'}`}>
                        {active && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />}
                        {active ? 'Đang chọn' : isOwner ? 'Cho thuê thiết bị' : 'Tìm và thuê thiết bị'}
                      </span>
                    </button>
                  })}
                </div>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{selectedWorkspace ? `Workspace ${selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'}` : 'Chưa chọn workspace'}</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">{selectedWorkspace === 'OWNER' ? 'Quản lý thiết bị cho thuê, đơn hàng và doanh thu.' : selectedWorkspace === 'RENTER' ? 'Tìm thiết bị, quản lý giỏ hàng và theo dõi đơn thuê.' : 'Chọn Owner để cho thuê thiết bị hoặc Renter để tìm và thuê thiết bị.'}</p>
                </div>
                {selectedWorkspaceAvailable
                  ? <Link className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2" to={selectedWorkspacePath}>Mở workspace {selectedWorkspace === 'OWNER' ? 'Owner' : 'Renter'} <span aria-hidden="true">→</span></Link>
                  : <span className="mt-3 block rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-500">Chọn một workspace ở trên để tiếp tục.</span>}
              </div> : <div className="mt-4 flex gap-3 rounded-xl border border-orange-100 bg-orange-50 px-3 py-3 text-xs leading-5 text-orange-800"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-orange-600"><Icon name="shield" size={16} /></span><span>Tài khoản Admin quản lý hệ thống tại khu vực quản trị.</span></div>}
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
              <div><h2 className="text-lg font-bold text-slate-900">{activeTab.label}</h2><p className="mt-1 text-sm text-slate-500">{tabKey === 'profile' ? 'Thông tin hiển thị trong tài khoản LensRent của bạn.' : tabKey === 'verification' ? 'Xác minh điện thoại và gửi giấy tờ cá nhân để Admin duyệt.' : tabKey === 'security' ? 'Quản lý mật khẩu dùng để đăng nhập tài khoản.' : tabKey === 'payments' ? 'Quản lý ví, tiền cọc và tài khoản nhận tiền.' : 'Tùy chỉnh những thông tin LensRent gửi đến bạn.'}</p></div>
            </div>

            {activeTab.key === 'profile' && (profileLoading ? <SectionCard title="Đang tải hồ sơ..." /> : profileError ? <SectionCard title="Không tải được hồ sơ"><p className="text-sm text-red-700">{profileError}</p><button className="mt-4 rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white" onClick={loadProfile} type="button">Thử lại</button></SectionCard> : <ProfileTab key={profile.id} notify={notify} profile={profile} onProfileUpdated={handleProfileUpdated} />)}
            {activeTab.key === 'security' && <SecurityTab notify={notify} />}
            {activeTab.key === 'verification' && <VerificationTab notify={notify} profile={profile} />}
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
