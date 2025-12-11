import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiBase, api, getToken } from '../api/client'

export function GedcomImport() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [trees, setTrees] = useState<Array<{id:string,name:string}>>([])
  const [treeId, setTreeId] = useState<string>('')
  const inputRef = useRef<HTMLInputElement|null>(null)
  useEffect(()=>{ (async()=>{ try { const t = await api<Array<{id:string,name:string}>>('/trees'); setTrees(t); if (t[0]) setTreeId(t[0].id) } catch(e){ if(e instanceof Error) setError(e.message) } })() }, [])
  return (
    <div className="grid gap-6">
      {error && (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h1 className="card-title text-2xl font-bold text-primary">Import GEDCOM</h1>
          <div className="mt-4 grid gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Arbre cible</span>
              </label>
              <select className="select select-bordered" value={treeId} onChange={e=>setTreeId(e.target.value)}>
                {trees.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            
            <input ref={inputRef} type="file" accept=".ged" className="hidden" onChange={e=> setFile(e.target.files?.[0] ?? null)} />
            <div
              className="rounded-box border-2 border-dashed border-base-300 p-10 text-center hover:bg-base-200 transition-colors cursor-pointer"
              onDragOver={e=>{ e.preventDefault() }}
              onDrop={e=>{ e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f) }}
              onClick={()=> inputRef.current?.click()}
            >
              <p className="text-base-content font-medium">Glisser le fichier .ged ici ou cliquer pour parcourir</p>
              {file ? (
                <div className="mt-4 badge badge-primary badge-lg gap-2">
                  {file.name}
                  <button type="button" className="btn btn-xs btn-circle btn-ghost" onClick={(e)=> { e.stopPropagation(); setFile(null); }}>✕</button>
                </div>
              ) : (
                 <button type="button" className="btn btn-sm btn-outline btn-primary mt-4">Sélectionner un fichier</button>
              )}
            </div>

            <div className="card-actions justify-end mt-4">
              <button disabled={loading} className="btn btn-primary text-white" onClick={async()=>{
                try {
                  if (!file || !treeId) { setError('Sélectionner le fichier et l\'arbre'); return }
                  setLoading(true)
                  setError(null)
                  const fd = new FormData()
                  fd.append('file', file)
                  fd.append('treeId', treeId)
                  const token = getToken()
                  const res = await fetch(`${apiBase}/gedcom/import`, { method:'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} })
                  if (!res.ok) throw new Error(await res.text())
                  const json = await res.json()
                  // Redirect to Tree Editor
                  navigate(`/trees/${treeId}`)
                } catch (e) { 
                    if(e instanceof Error) setError(e.message) 
                } finally {
                    setLoading(false)
                }
              }}>
                {loading ? <span className="loading loading-spinner"></span> : 'Importer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
