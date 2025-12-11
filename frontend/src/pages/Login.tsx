import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-slate-800">Connexion</h2>
        {error && <div className="mt-3 rounded bg-rose-100 text-rose-700 px-3 py-2">{error}</div>}
        <form className="mt-4 space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await signIn(email, password) } catch (err) { if(err instanceof Error) setError(err.message) } }}>
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" className="w-full px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Se connecter</button>
        </form>
      </div>
    </div>
  )
}
