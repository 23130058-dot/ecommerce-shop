import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  if (currentPath === '/login') return <LoginPage />
  if (currentPath === '/register') return <RegisterPage />
  const categoryMatch = currentPath.match(/^\/categories(?:\/([^/]+))?$/)
  if (categoryMatch) return <CategoryPage categorySlug={categoryMatch[1] || 'all'} />
  return <HomePage />
}

export default App

