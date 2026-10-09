import footerEmailIcon from '../../assets/lensrent/footer-email.svg'
import footerFacebookIcon from '../../assets/lensrent/footer-facebook.svg'
import footerInstagramIcon from '../../assets/lensrent/footer-instagram.svg'
import footerLocationIcon from '../../assets/lensrent/footer-location.svg'
import footerPhoneIcon from '../../assets/lensrent/footer-phone.svg'
import footerXIcon from '../../assets/lensrent/footer-x.svg'

export default function Footer() {
  const footerColumns = [
    {
      title: 'HỖ TRỢ',
      links: [
        'Câu hỏi thường gặp',
        'Hướng dẫn thuê thiết bị',
        'Chính sách bảo hành',
        'Trung tâm cứu hộ',
      ],
    },
    {
      title: 'PHÁP LÝ',
      links: [
        'Điều khoản dịch vụ',
        'Chính sách bảo mật',
        'Chính sách hoàn tiền',
        'Quy chế hoạt động',
      ],
    },
  ]

  const contactItems = [
    {
      icon: footerLocationIcon,
      text: 'Số 1, Đường Trần Hưng Đạo, Quận 1, TP.HCM',
    },
    {
      icon: footerPhoneIcon,
      text: '+84 28 1234 5678',
    },
    {
      icon: footerEmailIcon,
      text: 'support@lensrent.vn',
    },
  ]

  return (
      <footer className="w-full bg-white px-6 py-10 text-gray-500">
        <div className="mx-auto w-full max-w-[1280px]">

          {/* 4 CỘT FOOTER */}
          <div className="grid grid-cols-4 items-start justify-items-center gap-8">

            {/* LIÊN HỆ */}
            <div className="text-center">
              <h2 className="text-[11px] font-bold text-gray-900">
                LIÊN HỆ
              </h2>

              <ul className="mt-4 space-y-3">
                {contactItems.map((item) => (
                    <li
                        key={item.text}
                        className="flex items-center justify-start gap-2 text-[11px] leading-4"
                    >
                      <img
                          className="h-4 w-4 shrink-0"
                          src={item.icon}
                          alt=""
                      />
                      <span>{item.text}</span>
                    </li>
                ))}
              </ul>
            </div>

            {/* HỖ TRỢ + PHÁP LÝ */}
            {footerColumns.map((column) => (
                <div
                    key={column.title}
                    className="text-left"
                >
                  <h2 className="text-[11px] font-bold text-gray-900">
                    {column.title}
                  </h2>

                  <ul className="mt-4 space-y-3 text-[11px]">
                    {column.links.map((link) => (
                        <li key={link}>
                          <a
                              href="#about"
                              className="hover:text-[#ff5500]"
                          >
                            {link}
                          </a>
                        </li>
                    ))}
                  </ul>
                </div>
            ))}

            {/* KẾT NỐI */}
            <div className="text-left">
              <h2 className="text-[11px] font-bold text-gray-900">
                KẾT NỐI
              </h2>

              <div className="mt-4 flex justify-center gap-3">
                <a
                    className="flex size-7 items-center justify-center rounded-full bg-gray-100"
                    href="#facebook"
                    aria-label="Facebook"
                >
                  <img src={footerFacebookIcon} alt="" />
                </a>

                <a
                    className="flex size-7 items-center justify-center rounded-full bg-gray-100"
                    href="#instagram"
                    aria-label="Instagram"
                >
                  <img src={footerInstagramIcon} alt="" />
                </a>

                <a
                    className="flex size-7 items-center justify-center rounded-full bg-gray-100"
                    href="#x"
                    aria-label="X"
                >
                  <img src={footerXIcon} alt="" />
                </a>
              </div>
            </div>

          </div>

          {/* DÒNG CUỐI */}
          <div className="mt-8 border-t border-gray-200 pt-5">

            <div className="flex items-center justify-center gap-10 text-[10px]">
              <p>
                © 2026 LensRent Việt Nam. Tất cả quyền được bảo lưu.
              </p>

              <a
                  className="hover:text-[#ff5500]"
                  href="#terms"
              >
                Điều khoản sử dụng
              </a>

              <a
                  className="hover:text-[#ff5500]"
                  href="#privacy"
              >
                Bảo mật thông tin
              </a>
            </div>

          </div>

        </div>
      </footer>
  )
}