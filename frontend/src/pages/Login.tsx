import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-6 text-primary">Connexion</h2>
          
          {error && (
            <div role="alert" className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); try { await signIn(email, password) } catch (err) { if(err instanceof Error) setError(err.message) } }}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input type="email" placeholder="votre@email.com" className="input input-bordered w-full" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Mot de passe</span>
              </label>
              <input type="password" placeholder="••••••••" className="input input-bordered w-full" value={password} onChange={e=>setPassword(e.target.value)} required />
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">Mot de passe oublié ?</a>
              </label>
            </div>

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary text-white text-lg">Se connecter</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
