import { useEffect, useState } from 'react'
import CategoriesSection from '../components/home/CategoriesSection.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import Hero from '../components/home/Hero.jsx'
import OwnerCallToAction from '../components/home/OwnerCallToAction.jsx'
import Partners from '../components/home/Partners.jsx'
import WhyChooseUs from '../components/home/WhyChooseUs.jsx'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { getCatalogProducts } from '../services/productApi.js'

export default function HomePage() {
  const [searchValue, setSearchValue] = useState('')
  const [activeFilter, setActiveFilter] = useState('popular')
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
          sort: activeFilter,
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
  }, [activeFilter, retryToken, searchValue])

  const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div id="top" className="min-h-screen bg-white font-sans text-[#111827]">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
      <main>
        <Hero searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
        <CategoriesSection />
        <FeaturedProducts
          products={products}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          searchValue={searchValue}
          isLoading={isLoading}
          loadError={loadError}
          onRetry={() => setRetryToken((value) => value + 1)}
        />
        <WhyChooseUs />
        <OwnerCallToAction />
        <Partners />
      </main>
      <Footer />
    </div>
  )
}