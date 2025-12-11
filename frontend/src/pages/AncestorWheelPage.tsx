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

  if (loading) return <div className="p-4">Chargement…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!root) return <div className="p-4">Aucune personne</div>

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm">Personne racine</label>
          <select className="border rounded px-2 py-1" value={root.id} onChange={e => setRoot(persons.find(p => p.id === e.target.value) || null)}>
            {persons.map(p => (
              <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Générations</label>
          <select className="border rounded px-2 py-1" value={depth} onChange={e => setDepth(parseInt(e.target.value))}>
            {Array.from({length: maxDepth}, (_,i)=>i+1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full h-[720px] border rounded bg-slate-50">
        <AncestorWheel root={root} persons={persons} depth={depth} />
      </div>
    </div>
  )
}
