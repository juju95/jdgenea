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
  if (!root) return <div className="p-4">Aucune personne</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm">Personne racine</label>
        <select className="border rounded px-2 py-1" value={root.id} onChange={e => setRoot(persons.find(p => p.id === e.target.value) || null)}>
          {persons.map(p => (
            <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
          ))}
        </select>
      </div>
      <div className="w-full h-[720px] border rounded bg-slate-50">
        <FamilyWheel root={root} parents={parents} spouses={spouses} siblings={siblings} children={children} />
      </div>
    </div>
  )
}
