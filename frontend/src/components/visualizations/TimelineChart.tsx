import React, { useMemo } from 'react'
import type { ChartProps } from './utils'

export const TimelineChart: React.FC<ChartProps> = ({ persons, rootId, onSelect, width = 800, livingThreshold = 100 }) => {
    
    // Filter relevant persons (Ancestors + Descendants of Root?)
    // Or just all? Timeline usually good for a subset.
    // Let's show Root + Ancestors (2 generations) + Descendants (2 generations)
    
    const timelineData = useMemo(() => {
        return persons
            .filter(p => p.birthDate) // Must have birth date
            .map(p => {
                const birthYear = parseInt(p.birthDate!.substring(0, 4))
                let deathYear = p.deathDate ? parseInt(p.deathDate.substring(0, 4)) : null
                
                if (!deathYear && !p.isLiving) {
                    // Estimated death
                    deathYear = birthYear + livingThreshold
                } else if (!deathYear && p.isLiving) {
                    deathYear = new Date().getFullYear()
                }
                
                return {
                    person: p,
                    start: birthYear,
                    end: deathYear || birthYear,
                    type: p.id === rootId ? 'root' : 'relative'
                }
            })
            .sort((a, b) => a.start - b.start)
    }, [persons, rootId, livingThreshold])

    const minYear = Math.min(...timelineData.map(d => d.start)) - 10
    const maxYear = new Date().getFullYear() + 5
    const totalYears = maxYear - minYear
    const pxPerYear = width / totalYears

    return (
        <div className="overflow-x-auto overflow-y-auto h-[600px] bg-slate-50 p-4 border rounded">
            <div style={{ width: width, position: 'relative', height: timelineData.length * 30 + 50 }}>
                {/* Axis */}
                <div className="absolute top-0 left-0 right-0 h-8 border-b border-slate-300 flex text-xs text-slate-500">
                    {Array.from({ length: Math.ceil(totalYears / 10) }).map((_, i) => (
                        <div key={i} className="absolute border-l border-slate-300 h-2" style={{ left: (i * 10 * pxPerYear) }}>
                            <span className="absolute -top-4 -left-3">{minYear + (i * 10)}</span>
                        </div>
                    ))}
                </div>
                
                {/* Bars */}
                {timelineData.map((d, i) => (
                    <div 
                        key={d.person.id}
                        onClick={() => onSelect(d.person.id)}
                        className={`absolute h-6 rounded px-2 text-xs flex items-center cursor-pointer hover:ring-2 ring-indigo-300 whitespace-nowrap overflow-hidden transition-all
                            ${d.type === 'root' ? 'bg-indigo-500 text-white z-10' : d.person.gender === 'F' ? 'bg-rose-200 text-rose-900' : 'bg-sky-200 text-sky-900'}
                        `}
                        style={{
                            top: 40 + (i * 28),
                            left: (d.start - minYear) * pxPerYear,
                            width: Math.max(2, (d.end - d.start) * pxPerYear),
                            opacity: 0.9
                        }}
                        title={`${d.person.firstName} ${d.person.lastName} (${d.start} - ${d.end})`}
                    >
                        {d.person.lastName} {d.person.firstName}
                    </div>
                ))}
            </div>
        </div>
    )
}
