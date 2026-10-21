import whyUsPhoto from '../../assets/lensrent/why-us-production.png'

export default function WhyChooseUs() {
  const benefits = [
    { title: 'Kiểm tra kỹ thuật khắt khe', body: 'Thiết bị được test cảm biến, lens và kiểm tra kỹ thuật 12 bước trước khi giao.' },
    { title: 'Bảo hiểm thiết bị toàn diện', body: 'Yên tâm sáng tạo với gói bảo hiểm rủi ro hư hỏng không mong muốn.' },
    { title: 'Giao hàng hỏa tốc 2H', body: 'Nội thành TP.HCM nhận máy ngay trong 2 tiếng kể từ khi xác nhận.' },
  ]

  return (
    <section className="mx-auto grid max-w-[1232px] gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center" id="about">
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.275px] text-[#ff5500]">Tại sao chọn chúng tôi</p>
        <h2 className="text-2xl font-bold leading-[1.25] text-[#111827]">Quy trình chuyên nghiệp<br />Dành cho người làm nghề</h2>
        <p className="mt-4 max-w-[592px] text-sm leading-6 text-gray-500">
          Chúng tôi hiểu rằng thiết bị là trái tim của mọi buổi quay chụp. LensRent cam kết mang tới những bộ máy được bảo trì chuẩn xác nhất.
        </p>
        <ul className="mt-6 space-y-4">
          {benefits.map((benefit) => (
            <li className="flex gap-3" key={benefit.title}>
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-[#ff5500]" aria-hidden="true">✓</span>
              <span>
                <span className="block text-xs font-bold text-gray-800">{benefit.title}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">{benefit.body}</span>
              </span>
            </li>
          ))}
        </ul>
        <a className="mt-6 inline-flex rounded-lg bg-[#ff5500] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-600" href="#rental-inquiry">
          Tìm hiểu thêm về quy trình
        </a>
      </div>

      <div className="relative lg:ml-1">
        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
          <img className="h-[300px] w-full object-cover sm:h-[380px]" src={whyUsPhoto} alt="Màn hình dựng phim trong phòng hậu kỳ" />
        </div>
        <div className="relative mx-4 -mt-12 max-w-[317px] rounded-xl bg-[#ff5500] p-5 text-white shadow-lg sm:absolute sm:-bottom-6 sm:-left-6 sm:mx-0 sm:mt-0">
          <p className="text-3xl font-extrabold leading-8">99.8%</p>
          <p className="mt-1 text-[11px] leading-4">Tỷ lệ thiết bị hoạt động hoàn hảo trong suốt quá trình quay của khách hàng.</p>
        </div>
      </div>
    </section>
  )
}
