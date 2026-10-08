import { Routes, Route } from 'react-router-dom'

import OwnerLayout from '../components/layout/OwnerLayout'

import OwnerDashboard from '../components/owner/OwnerDashboard'
import ScheduleOverview from '../components/owner/ScheduleOverview'
import ScheduleSettings from '../components/owner/ScheduleSettings'

import EquipmentList from '../components/owner/EquipmentList'
import EquipmentAdd from '../components/owner/EquipmentAdd'
import EquipmentEdit from '../components/owner/EquipmentEdit'

import ProductDetail from '../components/owner/ProductDetail'
import RentalHistory from '../components/owner/RentalHistory'
import Revenue from '../components/owner/Revenue'

import BookingList from '../components/owner/BookingList'
import ConfirmationCenter from '../components/owner/ConfirmationCenter'
import ReturnOrders from '../components/owner/ReturnOrders'
import ReturnConfirm from '../components/owner/ReturnConfirm'
import DamageReport from '../components/owner/DamageReport'

import Wallet from '../components/owner/Wallet'
import TransactionHistory from '../components/owner/TransactionHistory'

import ReviewCenter from '../components/owner/ReviewCenter'
import ReviewTenant from '../components/owner/ReviewTenant'

import ChatHistory from '../components/owner/ChatHistory'
import Notifications from '../components/owner/Notifications'

function OwnerPage() {
    return (
        <Routes>

            {/* =========================
                OWNER LAYOUT
            ========================= */}
            <Route element={<OwnerLayout />}>

                {/* Tổng quan */}
                <Route
                    path="/"
                    element={<OwnerDashboard />}
                />

                {/* =========================
                    LỊCH TRÌNH
                ========================= */}
                <Route
                    path="/schedule"
                    element={<ScheduleOverview />}
                />

                <Route
                    path="/schedule-settings"
                    element={<ScheduleSettings />}
                />

                {/* =========================
                    THIẾT BỊ
                ========================= */}
                <Route
                    path="/equipment"
                    element={<EquipmentList />}
                />

                <Route
                    path="/equipment/add"
                    element={<EquipmentAdd />}
                />

                <Route
                    path="/equipment/:id/edit"
                    element={<EquipmentEdit />}
                />

                <Route
                    path="/product/:id"
                    element={<ProductDetail />}
                />

                <Route
                    path="/rental-history"
                    element={<RentalHistory />}
                />

                {/* =========================
                    ĐƠN KHÁCH ĐẶT
                ========================= */}
                <Route
                    path="/bookings"
                    element={<BookingList />}
                />

                {/* =========================
                    XÁC NHẬN & BÁO LỖI
                ========================= */}
                <Route
                    path="/confirmation"
                    element={<ConfirmationCenter />}
                />

                <Route
                    path="/returns"
                    element={<ReturnOrders />}
                />

                <Route
                    path="/returns/:id/confirm"
                    element={<ReturnConfirm />}
                />

                <Route
                    path="/returns/:id/damage"
                    element={<DamageReport />}
                />

                {/* =========================
                    TÀI CHÍNH
                ========================= */}
                <Route
                    path="/wallet"
                    element={<Wallet />}
                />

                <Route
                    path="/revenue"
                    element={<Revenue />}
                />

                <Route
                    path="/transactions"
                    element={<TransactionHistory />}
                />

                {/* =========================
                    ĐÁNH GIÁ
                ========================= */}
                <Route
                    path="/reviews"
                    element={<ReviewCenter />}
                />

                <Route
                    path="/review-tenant"
                    element={<ReviewTenant />}
                />

                {/* =========================
                    CHAT
                ========================= */}
                <Route
                    path="/messages"
                    element={<ChatHistory />}
                />

                {/* =========================
                    THÔNG BÁO
                ========================= */}
                <Route
                    path="/notifications"
                    element={<Notifications />}
                />

            </Route>

        </Routes>
    )
}

export default OwnerPage