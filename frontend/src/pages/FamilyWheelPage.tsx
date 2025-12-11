import { useEffect, useMemo, useState } from 'react'
import type { Person } from '../types/person'
import { fetchPersons, fetchPerson } from '../utils/api'
import { FamilyWheel } from '../components/FamilyWheel'

export function FamilyWheelPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [root, setRoot] = useState<Person | null>(null)
  const [spouses, setSpouses] = useState<Person[]>([])
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
        if (r) {
          const full = await fetchPerson(r.id)
          const arr: Person[] = (full.marriages || []).map((m: any) => m.spouse).filter(Boolean)
          setSpouses(arr)
        }
      } catch (e: any) {
        setError(e.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const parents = useMemo(() => {
    if (!root) return []
    const arr: Person[] = []
    if (root.fatherId) { const f = persons.find(p => p.id === root.fatherId); if (f) arr.push(f) }
    if (root.motherId) { const m = persons.find(p => p.id === root.motherId); if (m) arr.push(m) }
    return arr
  }, [root, persons])

  const children = useMemo(() => {
    if (!root) return []
    return persons.filter(p => p.fatherId === root.id || p.motherId === root.id)
  }, [root, persons])

  const siblings = useMemo(() => {
    if (!root) return []
    return persons.filter(p => p.id !== root.id && (
      (root.fatherId && p.fatherId === root.fatherId) || (root.motherId && p.motherId === root.motherId)
    ))
  }, [root, persons])

  if (loading) return <div className="p-4">Chargement…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (persons.length === 0) return <div className="p-4">Aucune personne dans l'arbre</div>

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
        </div>
      </div>
      
      <div className="w-full h-[720px] border border-base-200 rounded-box bg-slate-50 shadow-xl overflow-hidden relative">
        {root ? (
          <FamilyWheel root={root} parents={parents} spouses={spouses} siblings={siblings} children={children} />
        ) : (
          <div className="flex items-center justify-center h-full text-base-content/50">
            Veuillez sélectionner une personne pour afficher la roue familiale
          </div>
        )}
      </div>
    </div>
  )
}
