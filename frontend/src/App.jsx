import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  return currentPath === '/login' ? <LoginPage /> : <HomePage />
}

export default App

