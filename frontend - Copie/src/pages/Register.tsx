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
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-slate-800">Inscription</h2>
        {error && <div className="mt-3 rounded bg-rose-100 text-rose-700 px-3 py-2">{error}</div>}
        <form className="mt-4 space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await signUp({ email, password, firstName, lastName }) } catch (err) { if(err instanceof Error) setError(err.message) } }}>
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Prénom" value={firstName} onChange={e=>setFirstName(e.target.value)} />
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Nom" value={lastName} onChange={e=>setLastName(e.target.value)} />
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" className="w-full px-4 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600">Créer mon compte</button>
        </form>
      </div>
    </div>
  )
}
