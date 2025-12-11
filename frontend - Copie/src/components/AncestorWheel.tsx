import { useMemo, useState } from 'react'
import type { Person } from '../types/person'

function Info({ p }: { p: Person }) {
  const birth = p.birthDate ? new Date(p.birthDate).toLocaleDateString('fr-FR') : ''
  const death = p.deathDate ? new Date(p.deathDate).toLocaleDateString('fr-FR') : ''
  return (
    <div className="text-xs">
      <div className="font-semibold">{p.lastName} {p.firstName}</div>
      <div className="text-[10px] text-slate-600">{birth && `° ${birth}`} {death && `† ${death}`}</div>
    </div>
  )
}

function computeRings(root: Person, persons: Person[], depth: number) {
  const byId = new Map(persons.map(p => [p.id, p]))
  const rings: (Array<Person|null>)[] = []
  rings.push([root])
  for (let g = 1; g < depth; g++) {
    const prev = rings[g-1]
    const arr: (Person|null)[] = []
    prev.forEach(p => {
      if (!p) { arr.push(null, null); return }
      const f = p.fatherId ? byId.get(p.fatherId) || null : null
      const m = p.motherId ? byId.get(p.motherId) || null : null
      arr.push(f, m)
    })
    rings.push(arr)
  }
  return rings
}

export function AncestorWheel({ root, persons, depth }: { root: Person, persons: Person[], depth: number }) {
  const rings = useMemo(() => computeRings(root, persons, depth), [root, persons, depth])
  const [hover, setHover] = useState<Person|null>(null)

  const center = { x: 600, y: 360 }
  const baseR = 80
  const stepR = 90

  return (
    <div className="relative w-full h-full">
      {rings.map((ring, g) => {
        const radius = baseR + g * stepR
        const count = ring.length
        return (
          <div key={g}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="#e2e8f0" />
            </svg>
            {ring.map((p, i) => {
              const angleStart = -90 + (360 * i) / count
              const angleEnd = -90 + (360 * (i+1)) / count
              const angleMid = (angleStart + angleEnd) / 2
              const radMid = angleMid * Math.PI/180
              const x = center.x + radius * Math.cos(radMid)
              const y = center.y + radius * Math.sin(radMid)
              const size = 56
              const visible = !!p
              return (
                <div key={g+'-'+i} className="absolute" style={{ left: x - size/2, top: y - size/2, width: size, height: size }}>
                  <div
                    className={`w-full h-full rounded-full border ${visible?'bg-white border-slate-300 hover:border-indigo-500':'bg-slate-200 border-slate-200'}`}
                    onMouseEnter={() => { if (p) setHover(p) }}
                    onMouseLeave={() => setHover(null)}
                    title={p ? `${p.lastName} ${p.firstName}` : ''}
                  />
                </div>
              )
            })}
          </div>
        )
      })}
      {hover && (
        <div className="absolute left-4 top-4 z-50 bg-white border rounded shadow p-2">
          <Info p={hover} />
        </div>
      )}
    </div>
  )
}
