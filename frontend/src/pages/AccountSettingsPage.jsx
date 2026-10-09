import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import avatar from '../assets/lensrent/avatar.png'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'

const settingsTabs = [
  { key: 'profile', path: '/renter/profile', label: 'Hồ sơ cá nhân', icon: 'user' },
  { key: 'security', path: '/renter/profile/security', label: 'Bảo mật', icon: 'shield' },
  { key: 'payments', path: '/renter/profile/payments', label: 'Thanh toán & Ví', icon: 'wallet' },
  { key: 'notifications', path: '/renter/profile/notifications', label: 'Thông báo', icon: 'bell' },
]

const workspaceLinks = [
  { label: 'Tổng quan', to: '/renter', icon: 'home' },
  { label: 'Đơn thuê của tôi', to: '/renter/orders', icon: 'calendar' },
  { label: 'Danh sách yêu thích', to: '/renter/favorites', icon: 'heart' },
  { label: 'Quản lý ví & Cọc', to: '/renter/profile/payments', icon: 'wallet' },
  { label: 'Lịch sử giao dịch', to: '/renter/profile/payments', icon: 'card' },
  { label: 'Thông báo', to: '/renter/profile/notifications', icon: 'bell' },
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

function Field({ label, value, onChange, placeholder, type = 'text', required = false, helper, endAdornment }) {
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

function ProfileTab({ notify }) {
  const [name, setName] = useState('Hoàng Nam')
  const [birthday, setBirthday] = useState('1998-08-15')
  const [email, setEmail] = useState('hoangnam@gmail.com')
  const [phone, setPhone] = useState('090 123 4567')
  const [occupation, setOccupation] = useState('Nhiếp ảnh gia')
  const [bio, setBio] = useState('Yêu thích nhiếp ảnh và khám phá những thiết bị mới.')
  const [address, setAddress] = useState('125 Nguyễn Huệ')
  const [district, setDistrict] = useState('Quận 1')
  const [city, setCity] = useState('TP. Hồ Chí Minh')
  const [photo, setPhoto] = useState(avatar)

  const save = (event) => {
    event.preventDefault()
    notify('Đã lưu thông tin hồ sơ')
  }

  const pickPhoto = (event) => {
    const file = event.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
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
              <Icon name="upload" size={16} /> Tải ảnh lên
              <input accept="image/png,image/jpeg" className="sr-only" onChange={pickPhoto} type="file" />
            </label>
          </div>
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Họ và tên" onChange={(event) => setName(event.target.value)} required value={name} />
            <Field label="Ngày sinh" onChange={(event) => setBirthday(event.target.value)} type="date" value={birthday} />
            <Field label="Địa chỉ Email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} endAdornment={<span className="absolute right-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Icon name="check" size={14} /> Đã xác minh</span>} />
            <Field label="Số điện thoại" onChange={(event) => setPhone(event.target.value)} value={phone} endAdornment={<span className="absolute right-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Icon name="check" size={14} /> Đã xác minh</span>} />
            <Field label="Nghề nghiệp / Vai trò" onChange={(event) => setOccupation(event.target.value)} value={occupation} />
            <label className="block min-w-0 sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Giới thiệu ngắn</span>
              <textarea className="min-h-[90px] w-full resize-y rounded-lg border border-slate-200 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" maxLength={240} onChange={(event) => setBio(event.target.value)} value={bio} />
              <span className="mt-1 block text-right text-xs text-slate-400">{bio.length}/240 ký tự</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Địa chỉ nhận thiết bị" description="Địa chỉ này được dùng làm địa chỉ nhận thiết bị mặc định khi đặt thuê.">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Địa chỉ" onChange={(event) => setAddress(event.target.value)} required value={address} />
            <Field label="Quận / Huyện" onChange={(event) => setDistrict(event.target.value)} required value={district} />
            <Field label="Tỉnh / Thành phố" onChange={(event) => setCity(event.target.value)} required value={city} />
          </div>
        </SectionCard>
        <SaveActions onCancel={() => notify('Đã hủy các thay đổi')} onSave={save} />
      </div>

      <aside className="space-y-5">
        <SectionCard className="overflow-hidden !p-0">
          <div className="bg-gradient-to-br from-[#f95318] to-[#ff7c37] px-5 py-5 text-white">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">LensRent Score</p>
              <Icon name="sparkles" size={20} />
            </div>
            <p className="mt-3 text-4xl font-extrabold tracking-tight">985<span className="ml-1 text-sm font-medium text-white/80">/ 1000</span></p>
            <p className="mt-2 text-xs text-white/85">Điểm uy tín rất tốt</p>
          </div>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Hồ sơ hoàn thiện</span><span className="font-semibold text-slate-800">85%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-orange-100"><div className="h-full w-[85%] rounded-full bg-[#ff6a2a]" /></div>
            <p className="text-xs leading-5 text-slate-500">Bổ sung ảnh giấy tờ để tăng độ tin cậy khi thuê thiết bị.</p>
            <Link className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-orange-600 hover:text-orange-700" to="/renter/profile/security">Hoàn thiện xác minh <Icon name="arrow" size={15} /></Link>
          </div>
        </SectionCard>

        <SectionCard title="Trạng thái xác minh">
          <div className="space-y-4">
            <VerificationRow label="Email" detail="hoangnam@gmail.com" />
            <VerificationRow label="Số điện thoại" detail="090 ••• ••67" />
            <VerificationRow label="Danh tính" detail="Chưa xác minh" pending />
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

function VerificationRow({ label, detail, pending = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${pending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon name={pending ? 'lock' : 'check'} size={15} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{label}</p><p className="truncate text-xs text-slate-500">{detail}</p></div>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${pending ? 'text-amber-600' : 'text-emerald-600'}`}>{pending ? 'Chưa có' : 'Đã xác minh'}</span>
    </div>
  )
}

function SecurityTab({ notify }) {
  const [twoFactor, setTwoFactor] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [password, setPassword] = useState('Lensrent@2026')
  const [recoveryEnabled, setRecoveryEnabled] = useState(false)

  return (
    <div className="space-y-5">
      <SectionCard title="Mật khẩu" description="Cập nhật mật khẩu định kỳ để bảo vệ tài khoản của bạn.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mật khẩu hiện tại" onChange={() => {}} type="password" value="••••••••••••" />
          <Field label="Mật khẩu mới" onChange={(event) => setPassword(event.target.value)} type={passwordVisible ? 'text' : 'password'} value={password} endAdornment={<button aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => setPasswordVisible(!passwordVisible)} type="button">{passwordVisible ? 'Ẩn' : 'Hiện'}</button>} />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">Mật khẩu nên có ít nhất 8 ký tự, gồm chữ và số.</p>
          <button className="rounded-lg bg-[#ff5500] px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600" onClick={() => notify('Đã cập nhật mật khẩu')} type="button">Cập nhật mật khẩu</button>
        </div>
      </SectionCard>

      <SectionCard title="Xác thực hai lớp" description="Thêm một lớp bảo vệ khi đăng nhập trên thiết bị mới.">
        <div className="divide-y divide-slate-100">
          <SettingRow icon="shield" title="Xác thực hai lớp" description="Yêu cầu mã xác nhận khi đăng nhập trên trình duyệt mới." trailing={<Toggle checked={twoFactor} label="Bật xác thực hai lớp" onChange={setTwoFactor} />} />
          <SettingRow icon="bell" title="Mã xác nhận qua SMS" description="Gửi mã đến số điện thoại 090 ••• ••67." trailing={<Toggle checked={smsAlerts} label="Nhận mã xác nhận qua SMS" onChange={setSmsAlerts} />} />
          <SettingRow icon="lock" title="Mã dự phòng" description={recoveryEnabled ? 'Mã dự phòng đã được tạo cho tài khoản.' : 'Tạo mã dùng một lần khi bạn không thể nhận SMS.'} trailing={<button className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { setRecoveryEnabled(true); notify('Đã tạo mã dự phòng') }} type="button">{recoveryEnabled ? 'Xem mã' : 'Tạo mã'}</button>} />
        </div>
      </SectionCard>

      <SectionCard title="Thiết bị đang đăng nhập" description="Kiểm tra các thiết bị đã sử dụng tài khoản LensRent.">
        <div className="divide-y divide-slate-100">
          <DeviceRow title="Windows · Chrome" detail="TP. Hồ Chí Minh · Đang sử dụng" current notify={notify} />
          <DeviceRow title="iPhone 15 · Safari" detail="TP. Hồ Chí Minh · 2 ngày trước" notify={notify} />
        </div>
      </SectionCard>

      <SectionCard title="Vô hiệu hóa tài khoản" description="Tạm ngừng tài khoản và đăng xuất khỏi mọi thiết bị.">
        <button className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50" onClick={() => notify('Tính năng vô hiệu hóa sẽ cần xác nhận qua email')} type="button">Vô hiệu hóa tài khoản</button>
      </SectionCard>
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

function DeviceRow({ title, detail, current = false, notify }) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600"><Icon name="camera" size={19} /></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{title}{current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Thiết bị này</span>}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>
      {!current && <button className="text-xs font-semibold text-red-600 hover:underline" onClick={() => notify('Đã đăng xuất thiết bị này')} type="button">Đăng xuất</button>}
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
  const [toast, setToast] = useState('')
  const [toastTimer, setToastTimer] = useState(null)
  const tabKey = location.pathname.split('/')[3] || 'profile'
  const activeTab = settingsTabs.find((tab) => tab.key === tabKey) || settingsTabs[0]

  const notify = (message) => {
    setToast(message)
    if (toastTimer) window.clearTimeout(toastTimer)
    const timer = window.setTimeout(() => setToast(''), 2800)
    setToastTimer(timer)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-900">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-9">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500"><Link className="hover:text-orange-600" to="/">Trang chủ</Link><span>/</span><Link className="hover:text-orange-600" to="/renter">Workspace</Link><span>/</span><span className="font-medium text-slate-700">Cài đặt tài khoản</span></div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Thiết lập tài khoản</p><h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[30px]">Cài đặt tài khoản</h1><p className="mt-2 text-sm text-slate-500">Quản lý thông tin cá nhân, bảo mật và phương thức thanh toán.</p></div>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600" to="/renter"><Icon name="arrow" size={16} className="rotate-180" /> Quay lại Workspace</Link>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-6">
          <aside className="space-y-4 lg:sticky lg:top-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <img alt="" className="size-12 rounded-full object-cover" src={avatar} />
                <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">Hoàng Nam</p><p className="mt-0.5 truncate text-xs text-slate-500">Người thuê hạng Pro</p></div>
              </div>
              <p className="px-2 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Workspace</p>
              <nav aria-label="Điều hướng Workspace" className="space-y-1">
                {workspaceLinks.map((item) => (
                  <NavLink key={item.label} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition ${isActive && item.to !== '/renter' ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}><Icon name={item.icon} size={17} /><span className="flex-1">{item.label}</span>{item.label === 'Đơn thuê của tôi' && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">2</span>}</NavLink>
                ))}
              </nav>
              <div className="my-3 border-t border-slate-100" />
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Tài khoản</p>
              <NavLink className={({ isActive }) => `flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] font-semibold transition ${isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} to="/renter/profile"><Icon name="settings" size={17} /><span>Cài đặt tài khoản</span></NavLink>
            </section>
            <section className="rounded-xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-center gap-2 text-orange-700"><Icon name="help" size={18} /><p className="text-sm font-bold text-slate-800">Bạn cần hỗ trợ?</p></div>
              <p className="mt-2 text-xs leading-5 text-slate-600">Đội ngũ LensRent luôn sẵn sàng giúp bạn quản lý tài khoản.</p>
              <a className="mt-3 inline-flex text-xs font-bold text-orange-700 hover:underline" href="mailto:support@lensrent.vn">Liên hệ hỗ trợ →</a>
            </section>
            <Link className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:text-orange-700" to="/owner"><Icon name="camera" size={17} /> Chuyển sang Owner</Link>
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

            {activeTab.key === 'profile' && <ProfileTab notify={notify} />}
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
