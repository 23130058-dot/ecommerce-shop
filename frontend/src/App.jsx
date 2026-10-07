import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  if (currentPath === '/login') return <LoginPage />
  if (currentPath === '/register') return <RegisterPage />
  return <HomePage />
}

export default App

