import { useMemo, useState } from 'react'
import CategoriesSection from '../components/home/CategoriesSection.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import Hero from '../components/home/Hero.jsx'
import OwnerCallToAction from '../components/home/OwnerCallToAction.jsx'
import Partners from '../components/home/Partners.jsx'
import WhyChooseUs from '../components/home/WhyChooseUs.jsx'
import Footer from '../components/layout/Footer.jsx'
import Header from '../components/layout/Header.jsx'
import { products } from '../data/homeData.js'

export default function HomePage() {
  const [searchValue, setSearchValue] = useState('')
  const [activeFilter, setActiveFilter] = useState('popular')
  const visibleProducts = useMemo(() => {
    const search = searchValue.trim().toLocaleLowerCase('vi')
    const filtered = products.filter((product) =>
      `${product.name} ${product.type} ${product.category} ${product.tags.join(' ')}`
        .toLocaleLowerCase('vi')
        .includes(search),
    )

    if (activeFilter === 'price') return [...filtered].sort((first, second) => first.price - second.price)
    if (activeFilter === 'newest') return [...filtered].reverse()
    return filtered
  }, [activeFilter, searchValue])

  const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })

  const chooseCategory = (keyword) => {
    setSearchValue(keyword)
    scrollToProducts()
  }

  return (
    <div id="top" className="min-h-screen bg-white font-sans text-[#111827]">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
      <main>
        <Hero searchValue={searchValue} onSearchChange={setSearchValue} onSearch={scrollToProducts} />
        <CategoriesSection onChooseCategory={chooseCategory} />
        <FeaturedProducts
          products={visibleProducts}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          searchValue={searchValue}
        />
        <WhyChooseUs />
        <OwnerCallToAction />
        <Partners />
      </main>
      <Footer />
    </div>
  )
}
