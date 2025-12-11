import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function Navbar() {
  const { token, setToken } = useAuth()
  return (
    <header className="bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-slate-700">JdGenea</Link>
        <nav className="flex items-center gap-3">
          {!token && <Link to="/login" className="px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Connexion</Link>}
          {!token && <Link to="/register" className="px-4 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600">Inscription</Link>}
          {token && <Link to="/dashboard" className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Dashboard</Link>}
          {token && <Link to="/import" className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">Import GEDCOM</Link>}
          {token && <button className="px-4 py-2 rounded-full bg-rose-500 text-white hover:bg-rose-600" onClick={()=>setToken(null)}>Déconnexion</button>}
        </nav>
      </div>
    </header>
  )
}
