import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function Navbar() {
  const { token, setToken } = useAuth()
  return (
    <div className="navbar bg-base-100 shadow-sm border-b border-base-200 px-4 md:px-8">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl font-display text-primary">JdGenea</Link>
      </div>
      <div className="flex-none gap-2">
        {!token ? (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Connexion</Link>
            <Link to="/register" className="btn btn-primary btn-sm text-white">Inscription</Link>
          </>
        ) : (
          <>
            <ul className="menu menu-horizontal px-1 hidden md:flex">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/import">Import GEDCOM</Link></li>
            </ul>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-xs">UI</span>
                </div>
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-200">
                <li className="md:hidden"><Link to="/dashboard">Dashboard</Link></li>
                <li className="md:hidden"><Link to="/import">Import GEDCOM</Link></li>
                <li><button onClick={() => setToken(null)} className="text-error">Déconnexion</button></li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
