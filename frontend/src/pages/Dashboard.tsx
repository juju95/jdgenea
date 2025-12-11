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
  useEffect(() => {
    (async () => {
      try {
        const data = await api<Tree[]>('/trees');
        if (Array.isArray(data)) {
          setTrees(data);
        } else {
          setTrees([]);
          console.error('Réponse API inattendue pour /trees:', data);
        }
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    })();
  }, [])
  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="alert" className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{success}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-bold text-base-content">Mes arbres</h2>
        <button className="btn btn-primary text-white" onClick={()=>document.getElementById('create_tree_modal')?.showModal()}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Créer un arbre
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trees.map(t => (
          <div className="card bg-base-100 shadow-lg border border-base-200 hover:shadow-xl transition-shadow" key={t.id}>
            <div className="card-body">
              <h3 className="card-title text-primary">{t.name}</h3>
              <p className="text-sm text-base-content/70">Arbre généalogique</p>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-secondary btn-sm text-white" onClick={()=>navigate(`/tree/${t.id}`)}>Ouvrir</button>
              </div>
            </div>
          </div>
        ))}
        {trees.length === 0 && (
          <div className="col-span-full py-12 text-center text-base-content/50 bg-base-100 rounded-xl border border-dashed border-base-300">
            <p>Aucun arbre pour le moment. Créez-en un !</p>
          </div>
        )}
      </div>

      <dialog id="create_tree_modal" className="modal">
        <div className="modal-box overflow-x-hidden">
          <h3 className="font-bold text-lg mb-4">Nouvel arbre</h3>
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <form className="space-y-4" onSubmit={async (e)=>{ e.preventDefault(); try { const created = await api<{id:string,name:string}>('/trees', { method: 'POST', body: JSON.stringify({ name }) }); setTrees(prev=>[...prev,{ id: created.id, name }]); setName(''); setSuccess('Arbre créé avec succès'); (document.getElementById('create_tree_modal') as HTMLDialogElement).close(); } catch (err) { if(err instanceof Error) setError(err.message) } }}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom de l'arbre</span>
              </label>
              <input type="text" className="input input-bordered w-full" placeholder="Ex: Famille Dupont" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={()=> (document.getElementById('create_tree_modal') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="btn btn-primary text-white">Créer</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
