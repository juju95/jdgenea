import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function Navbar() {
  const { token, setToken } = useAuth()
  return (
    <div className="navbar bg-slate-900 text-slate-100 shadow-md border-b border-slate-800 px-4 md:px-8 font-sans">
      <div className="flex-1 gap-4 items-center">
        <Link to="/" className="btn btn-ghost text-2xl font-serif tracking-wider text-primary-content hover:bg-slate-800 transition-colors duration-300">
          <span className="text-primary">Jd</span>Genea
        </Link>
        {token && (
          <div className="hidden md:flex gap-1">
             <Link to="/dashboard" className="btn btn-ghost btn-sm font-normal text-slate-300 hover:text-white hover:bg-slate-800">Tableau de bord</Link>
             <Link to="/import" className="btn btn-ghost btn-sm font-normal text-slate-300 hover:text-white hover:bg-slate-800">Import GEDCOM</Link>
          </div>
        )}
      </div>
      <div className="flex-none gap-4">
        {!token ? (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm text-slate-300 hover:text-white hover:bg-slate-800">Connexion</Link>
            <Link to="/register" className="btn btn-primary btn-sm text-white shadow-lg shadow-primary/30">Inscription</Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder ring ring-primary ring-offset-base-100 ring-offset-2">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-xs">UI</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[50] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100 text-base-content rounded-box w-52 border border-base-200">
                <li className="md:hidden"><Link to="/dashboard">Tableau de bord</Link></li>
                <li className="md:hidden"><Link to="/import">Import GEDCOM</Link></li>
                <li><button onClick={() => setToken(null)} className="text-error hover:bg-error/10">Déconnexion</button></li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
