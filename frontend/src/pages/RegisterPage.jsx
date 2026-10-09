import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, saveAuth } from '../services/authApi.js'
import Footer from '../components/layout/Footer.jsx'

function EyeIcon({ visible }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4">
      {visible ? (
        <>
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9.9 5.2A10.9 10.9 0 0112 5c5 0 8.7 4.2 9.7 6.2a1.7 1.7 0 010 1.6 13.5 13.5 0 01-3.1 3.8M6.2 6.3a13.5 13.5 0 00-3.9 4.9 1.7 1.7 0 000 1.6A10.8 10.8 0 0012 19a10 10 0 003.1-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M2.3 12s3.5-6.5 9.7-6.5 9.7 6.5 9.7 6.5-3.5 6.5-9.7 6.5S2.3 12 2.3 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.7" />
        </>
      )}
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v2.99h3.87c2.27-2.09 3.57-5.17 3.57-8.63Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.87-2.99c-1.07.72-2.43 1.15-4.06 1.15-3.12 0-5.76-2.1-6.7-4.92H1.3v3.09C3.27 21.02 7.27 24 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.32A7.2 7.2 0 0 1 4.92 12c0-.8.14-1.57.38-2.32V6.59H1.3A12 12 0 0 0 0 12c0 1.93.46 3.75 1.3 5.41l4-3.09Z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.27 0 3.27 2.98 1.3 6.59l4 3.09C6.24 6.86 8.88 4.76 12 4.76Z" />
    </svg>
  )
}

function GithubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current">
      <path d="M12 .7a11.3 11.3 0 00-3.57 22.02c.57.1.78-.25.78-.55v-2.16c-3.17.69-3.84-1.35-3.84-1.35-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.67 1.25 3.32.96.1-.74.4-1.25.72-1.54-2.53-.29-5.2-1.27-5.2-5.63 0-1.24.44-2.26 1.18-3.05-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.86 10.86 0 015.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.79 1.18 1.81 1.18 3.05 0 4.37-2.68 5.34-5.23 5.62.41.36.77 1.05.77 2.12v3.17c0 .3.21.66.79.55A11.3 11.3 0 0012 .7z" />
    </svg>
  )
}

function Field({ label, children, className = '', htmlFor }) {
  return (
    <div className={'block ' + className}>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.04em] text-gray-600" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [notice, setNotice] = useState(null)

  const passwordStrength = password
    ? [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
    : 2

const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice(null)
    const formData = new FormData(event.currentTarget)
    try {
      const auth = await registerUser({
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        password: formData.get('password'),
      })
      saveAuth(auth)
      navigate('/')
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    }
  }

  const showProviderNotice = (provider) => {
    setNotice({ type: 'error', message: 'Đăng ký bằng ' + provider + ' chưa được hỗ trợ.' })
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="flex min-h-[calc(100svh-270px)] items-center justify-center bg-[#f8fafc] px-6 py-8 max-lg:min-h-0">
        <section
          aria-label="Tạo tài khoản LensRent"
          className="grid w-full max-w-[1860px] overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12)] lg:min-h-[800px] lg:grid-cols-2"
        >
          <aside className="register-promo-grid relative flex min-h-[470px] flex-col overflow-hidden p-8 text-white sm:p-10 lg:min-h-[800px] lg:p-12">
            <div className="relative inline-flex w-fit rounded bg-[#ff5500] px-2 py-0.5 text-[10px] font-bold uppercase leading-[15px] tracking-[0.5px]">
              CINERENT PRO SYSTEM
            </div>

            <div className="relative mt-auto max-w-[620px] pb-2 pt-20">
              <h1 className="text-[30px] font-extrabold leading-[1.12] sm:text-[36px]">
                Kho thiết bị của
                <br />
                <span className="text-[#ff7040]">cả nước, trong tay bạn.</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-xs leading-[18px] text-gray-300">
                Hơn 5.000+ thiết bị máy ảnh và điện ảnh đã qua kiểm định kỹ thuật, sẵn sàng cho dự án tiếp theo.
              </p>

              <div className="mt-8 border-t border-white/15">
                <div className="border-b border-white/15 py-5">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#ff7040]">Miễn phí đăng ký</h2>
                  <p className="mt-2 text-[11px] leading-4 text-gray-400">
                    Không phí thường niên. Chỉ trả tiền khi bạn thuê thiết bị.
                  </p>
                </div>
                <div className="border-b border-white/15 py-5">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#ff7040]">Giảm 15% cho sinh viên</h2>
                  <p className="mt-2 text-[11px] leading-4 text-gray-400">
                    Xác minh thẻ sinh viên để nhận ưu đãi cho đơn thuê đầu tiên.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[800px] flex-col px-7 pb-8 pt-10 sm:px-10 lg:px-16 lg:pt-12">
            <div className="flex h-6 shrink-0 justify-end">
              <a className="text-xs text-gray-500 transition hover:text-[#ff5500]" href="/">
                ‹ Quay lại trang chủ
              </a>
            </div>

            <div className="mx-auto mt-6 w-full max-w-[780px]">
              <header>
                <h2 className="text-[24px] font-bold leading-8">Tạo tài khoản</h2>
                <p className="mt-1 max-w-[620px] text-xs leading-[18px] text-gray-500">
                  Tạo tài khoản bằng email và mật khẩu. Bạn có thể bổ sung thông tin xác minh sau.
                </p>
              </header>

              <div className="mt-7 border-b border-gray-200">
                <div className="w-fit border-b-2 border-[#ff5500] px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-[#ff5500]">
                  Email
                </div>
              </div>

              <form className="mt-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field htmlFor="register-full-name" label="Họ và tên">
                    <input
                      id="register-full-name"
                      autoComplete="name"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                      name="fullName"
                      placeholder="Nguyễn Minh Quân"
                      required
                    />
                  </Field>
                  <Field htmlFor="register-phone" label="Số điện thoại">
                    <input
                      id="register-phone"
                      autoComplete="tel"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                      name="phone"
                      placeholder="090 123 4567"
                      required
                      type="tel"
                    />
                  </Field>
                </div>

                <Field className="mt-4" htmlFor="register-email" label="Địa chỉ Email">
                  <input
                    id="register-email"
                    autoComplete="email"
                    className="h-11 w-full rounded-lg border border-[#f27a50] bg-white px-4 text-sm text-gray-800 outline-none shadow-[0_0_0_2px_rgba(255,85,0,0.12)] transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                    name="email"
                    placeholder="quan.nguyen@gmail.com"
                    required
                    type="email"
                  />
                </Field>

                <Field className="mt-4" htmlFor="register-password" label="Mật khẩu">
                  <span className="relative block">
                    <input
                      id="register-password"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                      minLength={8}
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      required
                      type={passwordVisible ? 'text' : 'password'}
                      value={password}
                    />
                    <button
                      aria-label={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700"
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      type="button"
                    >
                      <EyeIcon visible={passwordVisible} />
                    </button>
                  </span>
                  <span aria-label={'Độ mạnh mật khẩu: ' + passwordStrength + ' trên 4'} className="mt-2 flex gap-1.5">
                    {[0, 1, 2, 3].map((level) => (
                      <span
                        aria-hidden="true"
                        className={'h-[3px] flex-1 rounded-full ' + (level < passwordStrength ? 'bg-[#ff5500]' : 'bg-gray-200')}
                        key={level}
                      />
                    ))}
                  </span>
                  <span className="mt-2 block text-[10px] leading-4 text-gray-400">
                    Tối thiểu 8 ký tự. Nên dùng thêm chữ hoa và số để tăng độ an toàn.
                  </span>
                </Field>

                <label className="mt-5 flex cursor-pointer items-start gap-3 text-[11px] leading-[17px] text-gray-500">
                  <input
                    checked={acceptedTerms}
                    className="mt-0.5 size-[14px] shrink-0 accent-[#ff5500]"
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    required
                    type="checkbox"
                  />
                  <span>
                    Tôi đồng ý với <a className="font-semibold text-[#ff5500] hover:underline" href="#terms">Điều khoản dịch vụ</a> và{' '}
                    <a className="font-semibold text-[#ff5500] hover:underline" href="#privacy">Chính sách bảo mật</a> của LensRent Việt Nam.
                  </span>
                </label>

                <button className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#ff5500] text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5500]" type="submit">
                  Tạo tài khoản
                </button>
                {notice && <p aria-live="polite" className="mt-2 text-[11px] leading-4 text-red-600">{notice.message}</p>}
              </form>

              <div className="relative mt-6 flex h-6 items-center justify-center">
                <span className="h-px w-full bg-gray-200" />
                <span className="absolute bg-white px-3 text-[10px] font-semibold uppercase text-gray-400">Hoặc đăng ký với</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="flex h-[38px] items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => showProviderNotice('Google')}
                  type="button"
                >
                  <GoogleMark />
                  Google
                </button>
                <button
                  className="flex h-[38px] items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                  onClick={() => showProviderNotice('GitHub')}
                  type="button"
                >
                  <GithubMark />
                  Github
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                Đã có tài khoản?{' '}
                <a className="font-semibold text-[#ff5500] hover:text-orange-700" href="/login">Đăng nhập</a>
              </p>
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  )
}


