export default function OwnerCallToAction() {
  return (
    <section className="bg-[#18181b] px-6 py-12 text-center sm:py-14" id="rental-inquiry">
      <div className="mx-auto max-w-[896px]">
        <h2 className="text-xl font-bold leading-7 text-white">Bạn có thiết bị nhàn rỗi?</h2>
        <p className="mt-2 text-xs leading-5 text-gray-400">
          Gia nhập cộng đồng Owner của chúng tôi để tối ưu hóa nguồn vốn từ dàn máy của bạn. Chúng tôi quản lý, vận hành và bảo hiểm.
        </p>
        <form className="mt-4 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center" onSubmit={(event) => event.preventDefault()}>
          <button className="rounded-lg bg-[#ff5500] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-orange-600" type="button">
            Đăng ký ký gửi máy
          </button>
          <label className="flex h-9 min-w-0 items-center rounded-lg bg-white px-4 sm:w-64">
            <input className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400" type="tel" placeholder="Nhập số điện thoại để tư vấn..." aria-label="Số điện thoại để được tư vấn" />
          </label>
        </form>
      </div>
    </section>
  )
}
