import { useEffect, useMemo, useState } from 'react'
import type { Person } from '../types/person'
import { fetchPersons } from '../utils/api'

function format(d?: string | null) {
  return d ? new Date(d).toLocaleDateString('fr-FR') : ''
}

export function TimelinePage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<[number, number]>([1600, 2100])

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

  const width = 1200
  const height = 700
  const padding = 80
  const yStart = 140

  const scaleX = (year: number) => {
    const [min, max] = range
    const t = (year - min) / (max - min)
    return padding + t * (width - 2 * padding)
  }

  const ticks = useMemo(() => {
    const [min, max] = range
    const step = Math.max(5, Math.floor((max - min) / 12))
    const arr: number[] = []
    for (let y = min; y <= max; y += step) arr.push(y)
    return arr
  }, [range])

  if (loading) return <div className="p-4">Chargement…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Début</label>
          <input type="number" className="border rounded px-2 py-1 w-24" value={range[0]} onChange={e => setRange([parseInt(e.target.value), range[1]])} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Fin</label>
          <input type="number" className="border rounded px-2 py-1 w-24" value={range[1]} onChange={e => setRange([range[0], parseInt(e.target.value)])} />
        </div>
      </div>
      <div className="relative border rounded bg-white" style={{ width, height }}>
        <svg width={width} height={height}>
          <line x1={padding} x2={width - padding} y1={yStart} y2={yStart} stroke="#334155" strokeWidth={2} />
          {ticks.map(y => (
            <g key={y}>
              <line x1={scaleX(y)} x2={scaleX(y)} y1={yStart} y2={yStart + 8} stroke="#334155" />
              <text x={scaleX(y)} y={yStart + 24} textAnchor="middle" fontSize={12} fill="#334155">{y}</text>
            </g>
          ))}
        </svg>
        <div className="absolute left-0 right-0" style={{ top: yStart + 40 }}>
          {persons.map((p, idx) => {
            const by = p.birthDate ? new Date(p.birthDate).getFullYear() : null
            const dy = p.deathDate ? new Date(p.deathDate).getFullYear() : null
            const y = yStart + 50 + idx * 24
            const x1 = by ? scaleX(by) : padding
            const x2 = dy ? scaleX(dy) : x1 + 30
            return (
              <div key={p.id} className="absolute" style={{ left: 0, top: y }}>
                <div className="absolute" style={{ left: x1, top: 0, width: Math.max(2, x2 - x1), height: 2, backgroundColor: '#0ea5e9' }} />
                <div className="absolute" style={{ left: x2 + 6, top: -8 }}>
                  <div className="text-xs text-slate-800">
                    <span className="font-semibold">{p.lastName} {p.firstName}</span>
                    <span className="text-slate-500 ml-2">{format(p.birthDate)} {format(p.deathDate)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
