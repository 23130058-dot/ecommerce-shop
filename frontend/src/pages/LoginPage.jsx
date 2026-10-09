import { useState } from 'react'
import cameraBackground from '../assets/lensrent/hero-background.png'
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

function Benefit({ title, children }) {
  return (
    <div>
      <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase leading-4 text-[#ff5500]">
        <span className="size-1.5 shrink-0 rounded-full bg-[#ff5500]" />
        {title}
      </h2>
      <p className="pl-3 text-[11px] leading-[16.5px] text-gray-400">{children}</p>
    </div>
  )
}

export default function LoginPage() {
  const [method, setMethod] = useState('email')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [notice, setNotice] = useState('')

  const showUnavailableNotice = (event, message) => {
    event.preventDefault()
    setNotice(message)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setNotice('Giao diện đã sẵn sàng. Chức năng xác thực sẽ được kết nối với backend sau.')
  }

  const emailTabClass = method === 'email'
    ? 'relative text-[11px] font-bold uppercase text-[#ff5500]'
    : 'relative text-[11px] font-bold uppercase text-gray-400 transition hover:text-gray-700'
  const phoneTabClass = method === 'phone'
    ? 'relative text-[11px] font-bold uppercase text-[#ff5500]'
    : 'relative text-[11px] font-bold uppercase text-gray-400 transition hover:text-gray-700'

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <main className="flex min-h-[calc(100svh-270px)] items-center justify-center bg-[#f8fafc] px-6 py-8 max-lg:min-h-0">
        <section
          aria-label="Đăng nhập LensRent"
          className="grid w-full max-w-[1860px] overflow-hidden rounded-[14px] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12)] lg:min-h-[800px] lg:grid-cols-2"
        >
          <aside className="relative flex min-h-[470px] flex-col overflow-hidden bg-black p-8 text-white sm:p-10 lg:min-h-[800px] lg:p-12">
            <img className="absolute inset-0 size-full object-cover opacity-40" src={cameraBackground} alt="" />
            <div className="relative flex flex-1 flex-col">
              <div className="inline-flex w-fit rounded bg-[#ff5500] px-2 py-0.5 text-[10px] font-bold uppercase leading-[15px] tracking-[0.5px]">
                CINERENT PRO SYSTEM
              </div>
              <div className="flex flex-1 flex-col justify-center py-12">
                <div className="flex flex-col gap-4">
                  <h1 className="text-[30px] font-extrabold leading-[37.5px]">
                    Nâng tầm dự án
                    <br />
                    <span className="text-[#ff5500]">của bạn ngay hôm nay.</span>
                  </h1>
                  <p className="text-xs leading-4 text-gray-300">
                    Tham gia cộng đồng LensRent Việt Nam để tiếp cận kho thiết bị máy ảnh và điện ảnh hàng đầu tại TP.HCM và Hà Nội.
                  </p>
                  <div className="flex flex-col gap-3 pt-4">
                    <Benefit title="Thiết bị tuyển chọn">
                      100% ống kính và thân máy đều được kiểm tra kỹ thuật bởi chuyên gia trước khi giao.
                    </Benefit>
                    <Benefit title="Bảo hiểm chuyên nghiệp">
                      Yên tâm tác nghiệp với các gói bảo hiểm thiết bị linh hoạt cho mọi quy mô đoàn phim.
                    </Benefit>
                  </div>
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
              <div>
                <h2 className="text-[24px] font-bold leading-8">Đăng nhập</h2>
                <p className="mt-1 text-xs leading-[18px] text-gray-500">
                  Chào mừng bạn trở lại với LensRent Việt Nam.
                </p>
              </div>

              <div className="mt-7 grid h-[35px] grid-cols-2 border-b border-gray-200" role="tablist" aria-label="Phương thức đăng nhập">
                <button
                  aria-selected={method === 'email'}
                  className={emailTabClass}
                  onClick={() => setMethod('email')}
                  role="tab"
                  type="button"
                >
                  Email
                  {method === 'email' && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#ff5500]" />}
                </button>
                <button
                  aria-selected={method === 'phone'}
                  className={phoneTabClass}
                  onClick={() => setMethod('phone')}
                  role="tab"
                  type="button"
                >
                  Số điện thoại
                  {method === 'phone' && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#ff5500]" />}
                </button>
              </div>

              <form className="mt-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.04em] text-gray-600">
                      {method === 'email' ? 'Địa chỉ Email' : 'Số điện thoại'}
                    </span>
                    <input
                      autoComplete={method === 'email' ? 'email' : 'tel'}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                      name={method === 'email' ? 'email' : 'phone'}
                      placeholder={method === 'email' ? 'vidu@email.com' : '+84 9xx xxx xxx'}
                      required
                      type={method === 'email' ? 'email' : 'tel'}
                    />
                  </label>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.04em] text-gray-600">
                      <label htmlFor="login-password">Mật khẩu</label>
                      <button
                        className="text-[11px] font-semibold normal-case text-[#ff5500] hover:text-orange-700"
                        onClick={(event) => showUnavailableNotice(event, 'Chức năng lấy lại mật khẩu sẽ được bổ sung sau.')}
                        type="button"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <span className="relative block">
                      <input
                        id="login-password"
                        autoComplete="current-password"
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#ff5500] focus:ring-2 focus:ring-orange-100"
                        name="password"
                        placeholder="••••••••"
                        required
                        type={passwordVisible ? 'text' : 'password'}
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
                  </div>
                </div>

                <label className="mt-4 flex cursor-pointer items-center gap-2 text-[11px] leading-4 text-gray-500">
                  <input className="size-[13px] accent-blue-600" type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>

                <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff5500] text-[11px] font-bold uppercase text-white transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5500]" type="submit">
                  Đăng nhập
                  <span aria-hidden="true" className="text-base leading-none">→</span>
                </button>
                {notice && <p aria-live="polite" className="mt-2 text-[11px] leading-4 text-gray-500">{notice}</p>}
              </form>

              <div className="relative mt-6 flex h-6 items-center justify-center">
                <span className="h-px w-full bg-gray-200" />
                <span className="absolute bg-white px-3 text-[10px] font-semibold uppercase text-gray-400">Hoặc đăng nhập với</span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  className="flex h-[38px] items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                  onClick={(event) => showUnavailableNotice(event, 'Đăng nhập Google chưa được cấu hình.')}
                  type="button"
                >
                  <GoogleMark />
                  Google
                </button>
                <button
                  className="flex h-[38px] items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
                  onClick={(event) => showUnavailableNotice(event, 'Đăng nhập GitHub chưa được cấu hình.')}
                  type="button"
                >
                  <GithubMark />
                  Github
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                Chưa có tài khoản?{' '}
                <a className="font-semibold text-[#ff5500] hover:text-orange-700" href="/register">
                  Đăng ký ngay
                </a>
              </p>
            </div>

            <p className="mt-auto pt-8 text-center text-[9px] font-medium tracking-[1.2px] text-gray-400">
              LENSRENT VIỆT NAM – PROFESSIONAL MARKETPLACE V2.4.0
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  )
}



