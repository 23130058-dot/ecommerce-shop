import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OwnerPage from './pages/OwnerPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RenterPage from './pages/RenterPage.jsx'
import AccountSettingsPage from './pages/AccountSettingsPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminProductsPage from './pages/AdminProductsPage.jsx'
import AdminOrdersPage from './pages/AdminOrdersPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx'
import { getStoredAuth } from './services/authApi.js'

function AdminOnly({ children }) {
  const location = useLocation()
  const auth = getStoredAuth()
  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />
  if (auth.user?.role?.toUpperCase() !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function CategoryRoute() {
  const { categorySlug } = useParams()
  return <CategoryPage categorySlug={categorySlug} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/payment" element={<CheckoutPage />} />
        <Route path="/checkout/complete/:rentalId" element={<OrderConfirmationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminOnly><AdminDashboardPage /></AdminOnly>} />
        <Route path="/admin/users" element={<AdminOnly><AdminUsersPage /></AdminOnly>} />
        <Route path="/admin/products" element={<AdminOnly><AdminProductsPage /></AdminOnly>} />
        <Route path="/admin/devices" element={<Navigate to="/admin/products" replace />} />
        <Route path="/admin/orders" element={<AdminOnly><AdminOrdersPage /></AdminOnly>} />
        <Route path="/categories" element={<CategoryPage categorySlug="all" />} />
        <Route path="/categories/:categorySlug" element={<CategoryRoute />} />
        <Route path="/owner/*" element={<OwnerPage />} />
        <Route path="/renter/profile" element={<AccountSettingsPage />} />
        <Route path="/renter/profile/*" element={<AccountSettingsPage />} />
        <Route path="/renter/orders/:rentalId" element={<OrderConfirmationPage />} />
        <Route path="/renter/*" element={<RenterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
