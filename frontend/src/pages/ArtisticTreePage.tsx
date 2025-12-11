import { useEffect, useMemo, useState } from 'react'
import type { Person } from '../types/person'
import { fetchPersons } from '../utils/api'

type Model = 'classic' | 'modern' | 'abstract'

export function ArtisticTreePage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [model, setModel] = useState<Model>('classic')
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
      } catch (e: any) {
        setError(e.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const nodes = useMemo(() => persons.slice(0, 60), [persons])

  if (loading) return <div className="p-4">Chargement…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm">Modèle</label>
        <div className="flex gap-2">
          {(['classic','modern','abstract'] as Model[]).map(m => (
            <button key={m} onClick={()=>setModel(m)} className={`px-3 py-1 rounded border ${model===m?'bg-indigo-600 text-white border-indigo-600':'bg-white hover:bg-slate-100'}`}>{m}</button>
          ))}
        </div>
      </div>
      <div className="relative w-full h-[720px] border rounded bg-slate-50">
        <div className={`absolute inset-0 ${model==='classic'?'':'hidden'}`}>
          <div className="grid grid-cols-6 gap-6 p-6">
            {nodes.map(p => (
              <div key={p.id} className="bg-white rounded-xl border shadow-sm p-3">
                <div className="font-semibold truncate" title={`${p.lastName} ${p.firstName}`}>{p.lastName} {p.firstName}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {p.birthDate && `° ${new Date(p.birthDate).toLocaleDateString('fr-FR')}`}
                  {p.deathDate && `  † ${new Date(p.deathDate).toLocaleDateString('fr-FR')}`}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`absolute inset-0 ${model==='modern'?'':'hidden'}`}>
          <div className="p-6 flex flex-wrap gap-4">
            {nodes.map(p => (
              <div key={p.id} className="rounded-full border-2 border-indigo-300 bg-white px-4 py-3 shadow-sm">
                <div className="text-sm font-semibold">{p.lastName} {p.firstName}</div>
                <div className="text-[10px] text-slate-500">{p.birthDate && new Date(p.birthDate).toLocaleDateString('fr-FR')} {p.deathDate && new Date(p.deathDate).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`absolute inset-0 ${model==='abstract'?'':'hidden'}`}>
          <svg className="absolute inset-0 w-full h-full">
            {nodes.map((p, i) => (
              <g key={p.id}>
                <circle cx={80 + (i%12)*90} cy={80 + Math.floor(i/12)*90} r={34} fill="#fff" stroke="#64748b" />
                <text x={80 + (i%12)*90} y={80 + Math.floor(i/12)*90} textAnchor="middle" fontSize={10} fill="#0f172a">{p.lastName} {p.firstName}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}
