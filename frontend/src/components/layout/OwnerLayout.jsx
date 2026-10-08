import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import OwnerSidebar from '../owner/OwnerSidebar.jsx'

export default function OwnerLayout() {
    return (
        <div className="min-h-screen bg-[#F7F8FA]">

            {/* Header 68px */}
            <div className="h-[68px]">
                <Header />
            </div>

            {/* Owner content */}
            <div className="flex min-h-[calc(100vh-68px)]">

                {/* Sidebar 190px */}
                <OwnerSidebar />

                {/* Main */}
                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>

            </div>

            {/* Footer giữ nguyên */}
            <Footer />

        </div>
    )
}
