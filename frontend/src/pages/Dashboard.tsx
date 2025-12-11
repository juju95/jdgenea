import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

type Tree = { id: string, name: string }

export function Dashboard() {
  const [trees, setTrees] = useState<Tree[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()
  useEffect(() => { (async () => { try { const data = await api<Tree[]>('/trees'); setTrees(data) } catch (e) { if(e instanceof Error) setError(e.message) } })() }, [])
  return (
    <div className="grid gap-6">
      {error && <div className="rounded bg-rose-100 text-rose-700 px-3 py-2">{error}</div>}
      {success && <div className="rounded bg-emerald-100 text-emerald-700 px-3 py-2">{success}</div>}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold text-slate-800">Mes arbres</h2>
        <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={()=>document.getElementById('create_tree')?.showModal()}>Créer un arbre</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {trees.map(t => (
          <div className="bg-white border border-slate-200 rounded-xl shadow p-6" key={t.id}>
            <h3 className="text-lg font-semibold text-slate-800">{t.name}</h3>
            <p className="mt-1 text-sm text-slate-500">Arbre généalogique</p>
            <div className="mt-4 text-right">
              <button className="px-4 py-2 rounded bg-emerald-500 text-white hover:bg-emerald-600" onClick={()=>navigate(`/tree/${t.id}`)}>Ouvrir</button>
            </div>
          </div>
        ))}
      </div>

      <dialog id="create_tree" className="rounded-xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow p-6">
          <h3 className="text-lg font-semibold text-slate-800">Nouvel arbre</h3>
          <form className="mt-4 space-y-3" onSubmit={async (e)=>{ e.preventDefault(); try { const created = await api<{id:string,name:string}>('/trees', { method: 'POST', body: JSON.stringify({ name }) }); setTrees(prev=>[...prev,{ id: created.id, name }]); setName(''); setSuccess('Arbre créé avec succès'); (document.getElementById('create_tree') as HTMLDialogElement).close(); } catch (err) { if(err instanceof Error) setError(err.message) } }}>
            <input className="w-full px-4 py-2 rounded border border-slate-300" placeholder="Nom de l'arbre" value={name} onChange={e=>setName(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={()=> (document.getElementById('create_tree') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Créer</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
