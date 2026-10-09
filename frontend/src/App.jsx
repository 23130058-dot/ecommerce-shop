import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import CategoryPage from './pages/CategoryPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OwnerPage from './pages/OwnerPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RenterPage from './pages/RenterPage.jsx'
import AccountSettingsPage from './pages/AccountSettingsPage.jsx'

function CategoryRoute() {
  const { categorySlug } = useParams()
  return <CategoryPage categorySlug={categorySlug} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/categories" element={<CategoryPage categorySlug="all" />} />
        <Route path="/categories/:categorySlug" element={<CategoryRoute />} />
        <Route path="/owner/*" element={<OwnerPage />} />
        <Route path="/renter/profile" element={<AccountSettingsPage />} />
        <Route path="/renter/profile/*" element={<AccountSettingsPage />} />
        <Route path="/renter/*" element={<RenterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
