import { useMemo } from 'react'
import type { Person } from '../types/person'

function Label({ p }: { p: Person }) {
  const birth = p.birthDate ? new Date(p.birthDate).toLocaleDateString('fr-FR') : ''
  const death = p.deathDate ? new Date(p.deathDate).toLocaleDateString('fr-FR') : ''
  return (
    <div className="text-xs text-slate-800 text-center">
      <div className="font-semibold truncate" title={`${p.lastName} ${p.firstName}`}>{p.lastName} {p.firstName}</div>
      <div className="text-[10px] text-slate-500">{birth && `° ${birth}`}{death && `  † ${death}`}</div>
    </div>
  )
}

export function FamilyWheel({ root, parents, spouses, siblings, children }: { root: Person, parents: Person[], spouses: Person[], siblings: Person[], children: Person[] }) {
  const rings = useMemo(() => {
    return [
      { radius: 0, persons: [root] },
      { radius: 140, persons: spouses },
      { radius: 220, persons: parents },
      { radius: 300, persons: siblings },
      { radius: 380, persons: children },
    ]
  }, [root, parents, spouses, siblings, children])

  const center = { x: 600, y: 360 }

  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full">
        {rings.slice(1).map((r, i) => (
          <circle key={i} cx={center.x} cy={center.y} r={r.radius} fill="none" stroke="#e2e8f0" />
        ))}
      </svg>
      {rings.map((r, idx) => {
        const count = r.persons.length || 1
        return r.persons.map((p, i) => {
          const angle = count === 1 ? -90 : (-90 + (360 * i) / count)
          const rad = angle * Math.PI / 180
          const x = center.x + r.radius * Math.cos(rad)
          const y = center.y + r.radius * Math.sin(rad)
          const w = idx === 0 ? 180 : 160
          const h = idx === 0 ? 100 : 80
          return (
            <div key={p.id} className="absolute" style={{ left: x - w / 2, top: y - h / 2, width: w, height: h }}>
              <div className={`w-full h-full rounded-xl border bg-white shadow-sm ${idx===0?'border-indigo-500 ring-2 ring-indigo-200':'border-slate-200'} hover:shadow-md` }>
                <Label p={p} />
              </div>
            </div>
          )
        })
      })}
    </div>
  )
}
