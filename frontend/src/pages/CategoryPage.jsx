import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { categories, sortOptions } from '../data/homeData.js'
import { resolveProductImage } from '../components/home/productImageMap.js'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getCatalogProducts } from '../services/productApi.js'
import { addToCompare } from '../services/shoppingApi.js'
import { getStoredAuth } from '../services/authApi.js'

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

function getBrand(product) {
  if (product.brand) return product.brand
  const productName = product.name || ''
  return brands.find((brand) => productName.toLocaleLowerCase('vi').startsWith(brand.toLocaleLowerCase('vi'))) || 'Khác'
}

function matchesCategory(product, slug) {
  const category = (product.category || '').toLocaleLowerCase('vi')
  if (slug === 'may-anh') return category.includes('camera')
  if (slug === 'ong-kinh') return category.includes('lens')
  if (slug === 'phu-kien') return category.includes('accessory')
  if (slug === 'studio') return category.includes('drone') || category.includes('studio')
  return true
}

function FilterGroup({ title, children }) {
  return (
    <section className="border-b border-gray-200 py-5">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-gray-700">{title}</h2>
      {children}
    </section>
  )
}

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-gray-600">
      <input checked={checked} className="size-3.5 accent-[#ff5500]" onChange={onChange} type="checkbox" />
      <span>{label}</span>
    </label>
  )
}

function CatalogProductCard({ product }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [adding, setAdding] = useState(false)
  const [feedback, setFeedback] = useState('')
  const detailPath = '/products/' + product.id
  const handleCompare = async () => {
    if (!getStoredAuth()) {
      navigate('/login', { state: { from: location } })
      return
    }
    setAdding(true)
    setFeedback('')
    try {
      await addToCompare(product.id)
      setFeedback('Đã thêm vào so sánh')
    } catch (error) {
      setFeedback(error.message)
    } finally {
      setAdding(false)
      window.setTimeout(() => setFeedback(''), 2600)
    }
  }
  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-md">
      <Link className="block" to={detailPath} aria-label={'Xem chi tiết ' + product.name}>
        <div className="relative flex aspect-[1.28/1] items-center justify-center overflow-hidden bg-[#f0f3f7] p-4">
          <img className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]" src={resolveProductImage(product.imageKey)} alt={product.name} />
          {product.status === 'Đã thuê' && (
            <span className="absolute left-3 top-3 rounded bg-[#fff0eb] px-2 py-1 text-xs font-semibold text-[#e4501a]">ĐANG ĐƯỢC THUÊ</span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-600">★ {product.rating}</span>
        </div>
        <div className="min-h-[82px] px-3.5 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{product.type}</p>
          <h3 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-gray-800">{product.name}</h3>
          <p className="mt-1 truncate text-xs text-gray-500">{(product.tags || []).slice(0, 2).join(' · ')}</p>
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3.5 py-2.5">
        <p className="text-sm font-bold text-[#f04b0b]">
          {Number(product.price || 0).toLocaleString('vi-VN')}đ <span className="font-normal text-gray-400">/ ngày</span>
        </p>
        <Link className="rounded bg-[#ff5500] px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600" to={detailPath}>Xem chi tiết</Link>
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 pb-3">
        <button aria-label={'Thêm ' + product.name + ' vào danh sách so sánh'} className="rounded border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-[#ff5500] hover:text-[#ff5500] disabled:opacity-50" disabled={adding} onClick={handleCompare} type="button">{adding ? 'Đang thêm…' : '⇄ So sánh'}</button>
        {feedback && <span className="line-clamp-2 text-right text-xs text-gray-500" role="status">{feedback}</span>}
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
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const result = await getCatalogProducts({
          search: searchValue.trim(),
          sort: activeSort,
          limit: 100,
          signal: controller.signal,
        })
        setProducts(result)
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(error.message)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [activeSort, retryToken, searchValue])

  const visibleProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategories = selectedCategories.length === 0 || selectedCategories.some((item) => matchesCategory(product, item))
      const matchesBrands = selectedBrands.length === 0 || selectedBrands.includes(getBrand(product))
      return matchesCategories && matchesBrands && Number(product.price || 0) <= maxPrice
    })

    if (activeSort === 'price') return result.sort((first, second) => Number(first.price || 0) - Number(second.price || 0))
    return result
  }, [activeSort, maxPrice, products, selectedBrands, selectedCategories])

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
    <div id="top" className="flex min-h-screen flex-col bg-white font-sans text-[#111827]">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
      <main id="categories" className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-10">
        <nav aria-label="Đường dẫn" className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <Link className="hover:text-[#ff5500]" to="/">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <Link className="hover:text-[#ff5500]" to="/categories">Danh mục</Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-gray-600">{currentCategory?.name || 'Tất cả thiết bị'}</span>
        </nav>

        <div className="mb-7 border-b border-gray-200 pb-5">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#ff5500]">LensRent · Kho thiết bị</p>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold leading-8 text-gray-900 sm:text-[30px]">{content.title}</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">{content.intro}</p>
            </div>
            <p className="shrink-0 text-sm text-gray-500"><span className="font-semibold text-gray-700">{visibleProducts.length}</span> thiết bị</p>
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-9">
          <aside aria-label="Bộ lọc thiết bị" className="self-start rounded-lg border border-gray-200 bg-white px-4">
            <div className="flex items-center justify-between border-b border-gray-200 py-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-800">Bộ lọc</h2>
              <button className="text-xs font-semibold text-[#ff5500] hover:underline" onClick={() => {
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
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-500">
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
              <p className="inline-block rounded bg-[#ff5500] px-2 py-1 text-xs font-bold uppercase tracking-wide">Ưu đãi sinh viên</p>
              <h3 className="mt-2 text-sm font-bold leading-5">Giảm 15% phí thuê thiết bị</h3>
              <p className="mt-1.5 text-xs leading-5 text-gray-300">Xác minh thẻ sinh viên để nhận ưu đãi cho dự án của bạn.</p>
              <a className="mt-2 inline-block text-xs font-semibold text-[#ff7040] hover:underline" href="/register">Xem chi tiết →</a>
            </div>
          </aside>

          <section id="products" aria-label="Danh sách thiết bị">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-center">
              <p className="text-sm text-gray-500">Hiển thị <span className="font-semibold text-gray-800">{visibleProducts.length}</span> thiết bị</p>
              <div aria-label="Sắp xếp thiết bị" className="flex flex-wrap items-center gap-1">
                {sortOptions.map((option) => (
                  <button
                    aria-pressed={activeSort === option.key}
                    className={'rounded-md px-3 py-2 text-xs transition ' + (activeSort === option.key ? 'bg-[#fff0e9] font-bold text-[#ef4e0b]' : 'text-gray-500 hover:bg-gray-100')}
                    key={option.key}
                    onClick={() => setActiveSort(option.key)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {loadError ? (
              <div className="rounded-lg border border-red-200 bg-white px-6 py-12 text-center" role="alert">
                <p className="text-sm font-semibold text-red-700">{loadError}</p>
                <button className="mt-4 rounded bg-[#ff5500] px-4 py-2 text-sm font-semibold text-white" onClick={() => setRetryToken((value) => value + 1)} type="button">Thử tải lại</button>
              </div>
            ) : isLoading && products.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500" role="status">Đang tải thiết bị...</div>
            ) : visibleProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {visibleProducts.map((product) => <CatalogProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <p className="text-sm font-semibold text-gray-700">Chưa tìm thấy thiết bị phù hợp</p>
                <p className="mt-2 text-sm text-gray-500">Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.</p>
                <button className="mt-4 rounded bg-[#ff5500] px-4 py-2 text-sm font-semibold text-white" onClick={() => {
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
                <p className="mt-1 text-sm text-gray-500">Để lại nhu cầu, đội ngũ LensRent sẽ hỗ trợ bạn chọn bộ thiết bị.</p>
              </div>
              <a className="shrink-0 rounded bg-[#ff5500] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600" href="/login">Nhờ tư vấn</a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
