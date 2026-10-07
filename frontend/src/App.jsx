import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import OwnerPage from './pages/OwnerPage.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/owner/*" element={<OwnerPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App