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

import ReturnOrders from '../components/owner/ReturnOrders'
import ReturnConfirm from '../components/owner/ReturnConfirm'
import DamageReport from '../components/owner/DamageReport'

import TransactionHistory from '../components/owner/TransactionHistory'
import ReviewTenant from '../components/owner/ReviewTenant'

function OwnerPage() {
    return (
        <Routes>
                <Route element={<OwnerLayout />}>
            <Route path="/" element={<OwnerDashboard />} />

            <Route path="/schedule" element={<ScheduleOverview />} />
            <Route path="/schedule-settings" element={<ScheduleSettings />} />

            <Route path="/equipment" element={<EquipmentList />} />
            <Route path="/equipment/add" element={<EquipmentAdd />} />
            <Route path="/equipment/:id/edit" element={<EquipmentEdit />} />

            <Route path="/product/:id" element={<ProductDetail />} />

            <Route path="/rental-history" element={<RentalHistory />} />

            <Route path="/returns" element={<ReturnOrders />} />
            <Route path="/returns/:id/confirm" element={<ReturnConfirm />} />
            <Route path="/returns/:id/damage" element={<DamageReport />} />

            <Route path="/revenue" element={<Revenue />} />

            <Route path="/transactions" element={<TransactionHistory />} />

            <Route path="/review-tenant" element={<ReviewTenant />} />
                </Route>
        </Routes>
    )
}

export default OwnerPage