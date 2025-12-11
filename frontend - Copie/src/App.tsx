// styles via Tailwind/DaisyUI (index.css)
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Navbar } from './ui/Navbar'
import { Home } from './pages/Home'
import { TreeEditor } from './pages/TreeEditor'
import { GedcomImport } from './pages/GedcomImport'

function App() {
  const { token } = useAuth()
  return (
    <BrowserRouter>
      <div className="min-h-full bg-gradient-to-br from-base-100 to-white">
        <Navbar/>
        <div className="container mx-auto p-6">
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/login" element={!token ? <Login/> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register/> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={token ? <Dashboard/> : <Navigate to="/login" />} />
            <Route path="/tree/:id" element={token ? <TreeEditor/> : <Navigate to="/login" />} />
            <Route path="/import" element={token ? <GedcomImport/> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
