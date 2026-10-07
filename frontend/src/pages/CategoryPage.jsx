import { useMemo, useState } from 'react'
import { categories, products, sortOptions } from '../data/homeData.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'

const pageContent = {
  'may-anh': {
    title: 'Máy ảnh & Cinema Camera',
    intro: 'Từ máy ảnh mirrorless đến máy quay cinema chuyên nghiệp cho mọi dự án.',
    types: ['Mirrorless', 'Cinema Camera', 'Action Camera'],
  },
  'ong-kinh': {
    title: 'Ống kính quay chụp',
    intro: 'Chọn tiêu cự và khẩu độ phù hợp để kể câu chuyện hình ảnh của bạn.',
    types: ['Góc rộng', 'Tiêu chuẩn', 'Telephoto'],
  },
  'phu-kien': {
    title: 'Phụ kiện & thiết bị hỗ trợ quay chụp',
    intro: 'Hoàn thiện bộ thiết bị với phụ kiện cần thiết cho buổi quay và chụp.',
    types: ['Gimbal', 'Tripod', 'Monitor', 'Phụ kiện máy ảnh'],
  },
  studio: {
    title: 'Thiết bị Studio chuyên nghiệp',
    intro: 'Ánh sáng, phông nền và thiết bị hỗ trợ cho không gian studio.',
    types: ['Đèn LED', 'Softbox', 'Chân đèn', 'Phản quang'],
  },
}

const brands = ['Sony', 'Canon', 'RED', 'DJI']

function getBrand(productName) {
  return brands.find((brand) => productName.toLocaleLowerCase('vi').startsWith(brand.toLocaleLowerCase('vi'))) || 'Khác'
}

function matchesCategory(product, slug) {
  const category = product.category.toLocaleLowerCase('vi')
  if (slug === 'may-anh') return category.includes('camera')
  if (slug === 'ong-kinh') return category.includes('lens')
  if (slug === 'phu-kien') return category.includes('accessory')
  if (slug === 'studio') return category.includes('drone') || category.includes('studio')
  return true
}

function FilterGroup({ title, children }) {
  return (
    <section className="border-b border-gray-200 py-5">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-700">{title}</h2>
      {children}
    </section>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[11px] text-gray-600">
      <input checked={checked} className="size-3.5 accent-[#ff5500]" onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  )
}

function CatalogProductCard({ product }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-md">
      <a className="block" href="/login" aria-label={'Xem chi tiết ' + product.name}>
        <div className="relative flex aspect-[1.08/1] items-center justify-center overflow-hidden bg-[#f0f3f7] p-6">
          <img className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]" src={product.image} alt={product.name} />
          {product.status === 'Đã thuê' && (
            <span className="absolute left-3 top-3 rounded bg-[#fff0eb] px-2 py-1 text-[9px] font-semibold text-[#e4501a]">ĐANG ĐƯỢC THUÊ</span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-gray-600">★ {product.rating}</span>
        </div>
        <div className="min-h-[87px] px-3.5 py-3">
          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{product.type}</p>
          <h3 className="mt-1.5 line-clamp-2 min-h-8 text-[11px] font-bold leading-4 text-gray-800">{product.name}</h3>
          <p className="mt-1 text-[9px] text-gray-400">{product.tags.slice(0, 2).join(' · ')}</p>
        </div>
      </a>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3.5 py-2.5">
        <p className="text-[10px] font-bold text-[#f04b0b]">
          {product.price.toLocaleString('vi-VN')}đ <span className="font-normal text-gray-400">/ ngày</span>
        </p>
        <a className="rounded bg-[#ff5500] px-3 py-2 text-[9px] font-bold text-white transition hover:bg-orange-600" href="/login">Thuê ngay</a>
      </div>
    </article>
  )
}

export default function CategoryPage({ categorySlug }) {
  const currentCategory = categories.find((category) => category.slug === categorySlug)
  const slug = currentCategory?.slug || 'all'
  const content = pageContent[slug] || {
    title: 'Tất cả thiết bị',
    intro: 'Khám phá thiết bị quay chụp được tuyển chọn cho dự án tiếp theo của bạn.',
    types: [],
  }
  const [searchValue, setSearchValue] = useState('')
  const [activeSort, setActiveSort] = useState('popular')
  const [selectedCategories, setSelectedCategories] = useState(slug === 'all' ? [] : [slug])
  const [selectedBrands, setSelectedBrands] = useState([])
  const [maxPrice, setMaxPrice] = useState(8500000)

  const visibleProducts = useMemo(() => {
    const search = searchValue.trim().toLocaleLowerCase('vi')
    const result = products.filter((product) => {
      const matchesSearch = `${product.name} ${product.type} ${product.category} ${product.tags.join(' ')}`
        .toLocaleLowerCase('vi')
        .includes(search)
      const matchesCategories = selectedCategories.length === 0 || selectedCategories.some((item) => matchesCategory(product, item))
      const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(getBrand(product.name))
      return matchesSearch && matchesCategories && matchesBrands && product.price <= maxPrice
    })

    if (activeSort === 'price') return result.sort((first, second) => first.price - second.price)
    if (activeSort === 'newest') return result.reverse()
    return result
  }, [activeSort, maxPrice, searchValue, selectedBrands, selectedCategories])

  const toggleCategory = (selectedSlug) => {
    setSelectedCategories((previous) => previous.includes(selectedSlug)
      ? previous.filter((item) => item !== selectedSlug)
      : [...previous, selectedSlug])
  }

  const toggleBrand = (brand) => {
    setSelectedBrands((previous) => previous.includes(brand)
      ? previous.filter((item) => item !== brand)
      : [...previous, brand])
  }

  const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div id="top" className="min-h-screen bg-white font-sans text-[#111827]">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
      <main id="categories" className="mx-auto max-w-[1600px] px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <nav aria-label="Đường dẫn" className="mb-6 flex items-center gap-2 text-[10px] text-gray-400">
          <a className="hover:text-[#ff5500]" href="/">Trang chủ</a>
          <span aria-hidden="true">/</span>
          <a className="hover:text-[#ff5500]" href="/categories">Danh mục</a>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-gray-600">{currentCategory?.name || 'Tất cả thiết bị'}</span>
        </nav>

        <div className="mb-7 border-b border-gray-200 pb-5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff5500]">LensRent · Kho thiết bị</p>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold leading-8 text-gray-900 sm:text-[30px]">{content.title}</h1>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-gray-500">{content.intro}</p>
            </div>
            <p className="shrink-0 text-[11px] text-gray-400"><span className="font-semibold text-gray-700">{visibleProducts.length}</span> thiết bị mẫu</p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-9">
          <aside aria-label="Bộ lọc thiết bị" className="self-start rounded-lg border border-gray-200 bg-white px-4">
            <div className="flex items-center justify-between border-b border-gray-200 py-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-gray-800">Bộ lọc</h2>
              <button className="text-[10px] font-semibold text-[#ff5500] hover:underline" onClick={() => {
                setSelectedCategories([])
                setSelectedBrands([])
                setMaxPrice(8500000)
              }} type="button">Xóa lọc</button>
            </div>

            <FilterGroup title="Danh mục">
              {categories.map((category) => (
                <CheckRow
                  checked={selectedCategories.includes(category.slug)}
                  key={category.slug}
                  label={category.name}
                  onChange={() => toggleCategory(category.slug)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Giá thuê (VNĐ/ngày)">
              <div className="mb-2 flex items-center justify-between gap-2 text-[9px] text-gray-500">
                <span>200.000đ</span><span>{maxPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <input
                aria-label="Giá thuê tối đa"
                className="w-full accent-[#ff5500]"
                max={8500000}
                min={200000}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                step={50000}
                type="range"
                value={maxPrice}
              />
            </FilterGroup>

            <FilterGroup title="Hãng sản xuất">
              {brands.map((brand) => (
                <CheckRow checked={selectedBrands.includes(brand)} key={brand} label={brand} onChange={() => toggleBrand(brand)} />
              ))}
            </FilterGroup>

            <div className="mb-4 rounded-md bg-[#151515] p-3.5 text-white">
              <p className="inline-block rounded bg-[#ff5500] px-2 py-1 text-[8px] font-bold uppercase tracking-wide">Ưu đãi sinh viên</p>
              <h3 className="mt-2 text-[11px] font-bold leading-4">Giảm 15% phí thuê thiết bị</h3>
              <p className="mt-1.5 text-[9px] leading-4 text-gray-300">Xác minh thẻ sinh viên để nhận ưu đãi cho dự án của bạn.</p>
              <a className="mt-2 inline-block text-[9px] font-semibold text-[#ff7040] hover:underline" href="/register">Xem chi tiết →</a>
            </div>
          </aside>

          <section id="products" aria-label="Danh sách thiết bị">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
              <p className="text-[10px] text-gray-500">Hiển thị <span className="font-semibold text-gray-800">{visibleProducts.length}</span> thiết bị</p>
              <div aria-label="Sắp xếp thiết bị" className="flex flex-wrap items-center gap-1">
                {sortOptions.map((option) => (
                  <button
                    aria-pressed={activeSort === option.key}
                    className={'rounded-md px-3 py-2 text-[10px] transition ' + (activeSort === option.key ? 'bg-[#fff0e9] font-bold text-[#ef4e0b]' : 'text-gray-500 hover:bg-gray-100')}
                    key={option.key}
                    onClick={() => setActiveSort(option.key)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => <CatalogProductCard key={product.name} product={product} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-gray-700">Chưa tìm thấy thiết bị phù hợp</p>
                <p className="mt-2 text-xs text-gray-500">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.</p>
                <button className="mt-4 rounded bg-[#ff5500] px-4 py-2 text-xs font-semibold text-white" onClick={() => {
                  setSearchValue('')
                  setSelectedCategories([])
                  setSelectedBrands([])
                  setMaxPrice(8500000)
                }} type="button">Xem tất cả thiết bị</button>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg bg-[#f3f4f6] px-5 py-6 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Chưa tìm thấy thiết bị phù hợp?</h2>
                <p className="mt-1 text-[11px] text-gray-500">Để lại nhu cầu, đội ngũ LensRent sẽ hỗ trợ bạn chọn bộ thiết bị.</p>
              </div>
              <a className="shrink-0 rounded bg-[#ff5500] px-4 py-2.5 text-[10px] font-bold text-white transition hover:bg-orange-600" href="/login">Nhờ tư vấn</a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
