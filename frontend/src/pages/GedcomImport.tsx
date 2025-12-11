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
      {error && <div className="rounded bg-rose-100 text-rose-700 px-3 py-2">{error}</div>}
      <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold text-slate-800">Import GEDCOM</h1>
        <div className="mt-4 grid gap-3">
          <label className="text-sm text-slate-600">Arbre cible</label>
          <select className="px-3 py-2 rounded border" value={treeId} onChange={e=>setTreeId(e.target.value)}>
            {trees.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input ref={inputRef} type="file" accept=".ged" className="hidden" onChange={e=> setFile(e.target.files?.[0] ?? null)} />
          <div
            className="rounded border-2 border-dashed border-slate-300 p-6 text-center hover:bg-slate-50"
            onDragOver={e=>{ e.preventDefault() }}
            onDrop={e=>{ e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFile(f) }}
          >
            <p className="text-slate-600">Glisser le fichier .ged ici ou</p>
            <button type="button" className="mt-3 px-4 py-2 rounded bg-indigo-600 text-white" onClick={()=> inputRef.current?.click()}>Parcourir…</button>
            {file && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="text-sm text-slate-700">{file.name}</span>
                <button type="button" className="px-3 py-1 rounded bg-slate-100 text-slate-700" onClick={()=> setFile(null)}>Retirer</button>
              </div>
            )}
          </div>
          <button disabled={loading} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50" onClick={async()=>{
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
          }}>{loading ? 'Import en cours...' : 'Importer'}</button>
          
        </div>
      </div>
    </div>
  )
}
