import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import OwnerSidebar from '../owner/OwnerSidebar.jsx'

export default function OwnerLayout() {
    return (
        <div className="min-h-screen bg-[#f7f9fc] font-sans text-gray-900">
            <Header />
            <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-6">
                    <OwnerSidebar />
                    <section className="min-w-0">
                        <Outlet />
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    )
}