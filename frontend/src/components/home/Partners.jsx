export default function Partners() {
  return (
    <section className="border-b border-gray-200 bg-gray-50 px-6 py-6">
      <div className="mx-auto max-w-[1280px]">
        <p className="text-center text-[10px] font-bold uppercase tracking-[1px] text-gray-400">Đối tác tin cậy của các production house</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-bold text-gray-400 sm:gap-x-12">
          {['Sony', 'Canon', 'Nikon', 'Blackmagic', 'DJI', 'Arri'].map((brand) => <span key={brand}>{brand}</span>)}
        </div>
      </div>
    </section>
  )
}
