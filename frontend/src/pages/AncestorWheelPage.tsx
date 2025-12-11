import { useEffect, useMemo, useState } from 'react'
import type { Person } from '../types/person'
import { fetchPersons } from '../utils/api'
import { AncestorWheel } from '../components/AncestorWheel'

export function AncestorWheelPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [root, setRoot] = useState<Person | null>(null)
  const [depth, setDepth] = useState(4)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sortedPersons = useMemo(() => {
     return [...persons].sort((a, b) => {
         const la = (a.lastName || '').toLowerCase()
         const lb = (b.lastName || '').toLowerCase()
         if (la !== lb) return la.localeCompare(lb)
         
         const fa = (a.firstName || '').toLowerCase()
         const fb = (b.firstName || '').toLowerCase()
         return fa.localeCompare(fb)
     })
   }, [persons])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const data: Person[] = await fetchPersons()
        if (cancelled) return
        setPersons(data)
        const r = data.find(p => p.sosa === 1) || data[0] || null
        setRoot(r)
      } catch (e: any) {
        setError(e.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const maxDepth = useMemo(() => {
    if (!root) return 1
    let d = 1
    let curr = [root]
    while (curr.length && d < 10) {
      const next: Person[] = []
      curr.forEach(p => {
        if (p?.fatherId) { const f = persons.find(x => x.id === p.fatherId); if (f) next.push(f) }
        if (p?.motherId) { const m = persons.find(x => x.id === p.motherId); if (m) next.push(m) }
      })
      if (!next.length) break
      curr = next
      d++
    }
    return d
  }, [root, persons])

  if (loading) return <div className="p-8 flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
  if (error) return (
    <div role="alert" className="alert alert-error m-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>{error}</span>
    </div>
  )
  if (persons.length === 0) return <div className="p-8 text-center text-base-content/70">Aucune personne trouvée</div>

  return (
    <div className="p-4 space-y-4">
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body py-4 flex-row items-center gap-6">
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Personne centrale (Vue)</span>
              </label>
              <select className="select select-bordered select-sm" value={root?.id || ''} onChange={e => setRoot(persons.find(p => p.id === e.target.value) || null)}>
                <option value="">-- Sélectionner --</option>
                {sortedPersons.map(p => (
                  <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Générations</span>
              </label>
              <select className="select select-bordered select-sm" value={depth} onChange={e => setDepth(parseInt(e.target.value))}>
                {Array.from({length: maxDepth}, (_,i)=>i+1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
        </div>
      </div>
      <div className="w-full h-[720px] border border-base-200 rounded-box bg-base-100 shadow-xl overflow-hidden relative">
        {root ? (
          <AncestorWheel root={root} persons={persons} depth={depth} />
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            Veuillez sélectionner une personne
          </div>
        )}
      </div>
    </div>
  )
}
