import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import OwnerSidebar from '../owner/OwnerSidebar.jsx'
import { getStoredAuth } from '../../services/authApi.js'

export default function OwnerLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-[#f7f8fa] text-[#1f2937]">
            <Header />
            <div className="flex w-full flex-1 flex-col items-stretch lg:flex-row">
                <OwnerSidebar />
                <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
