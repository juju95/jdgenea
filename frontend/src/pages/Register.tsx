import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function Register() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-6 text-primary">Inscription</h2>
          {error && (
            <div role="alert" className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}
          <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); try { await signUp({ email, password, firstName, lastName }) } catch (err) { if(err instanceof Error) setError(err.message) } }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Prénom</span>
                </label>
                <input type="text" placeholder="Jean" className="input input-bordered w-full" value={firstName} onChange={e=>setFirstName(e.target.value)} required />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nom</span>
                </label>
                <input type="text" placeholder="Dupont" className="input input-bordered w-full" value={lastName} onChange={e=>setLastName(e.target.value)} required />
              </div>
            </div>
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
            </div>
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary text-white text-lg">Créer mon compte</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
