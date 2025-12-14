import React, { useMemo } from 'react'
import { ZoomPanContainer } from '../ZoomPanContainer'
import type { ChartProps } from './utils'

export const TimelineChart: React.FC<ChartProps & { scale?: number, contentRef?: React.Ref<HTMLDivElement> }> = ({ persons, rootId, onSelect, width = 800, livingThreshold = 100, scale = 1, contentRef }) => {
    
    const timelineData = useMemo(() => {
        const currentYear = new Date().getFullYear()
        
        return persons
            .filter(p => p.birthDate) // Must have birth date
            .map(p => {
                const birthYear = parseInt(p.birthDate!.substring(0, 4))
                let deathYear = p.deathDate ? parseInt(p.deathDate.substring(0, 4)) : null
                let isLiving = p.isLiving;
                let isEstimatedDeath = false;

                // Check living threshold even if isLiving is explicitly true (fix for bad data)
                if (currentYear - birthYear > livingThreshold) {
                    isLiving = false;
                }
                // If living status is ambiguous, use threshold
                else if (isLiving === undefined || isLiving === null) {
                    // If age < threshold, assume living
                    if (currentYear - birthYear < livingThreshold) {
                        isLiving = true;
                    } else {
                        isLiving = false;
                    }
                }
                
                if (!deathYear) {
                    if (isLiving) {
                        deathYear = currentYear;
                    } else {
                        // Presumed dead
                        // Calculate death date based on threshold
                        deathYear = birthYear + livingThreshold;
                        isEstimatedDeath = true;
                    }
                }
                
                return {
                    person: p,
                    start: birthYear,
                    end: deathYear,
                    type: p.id === rootId ? 'root' : 'relative',
                    isLiving,
                    isEstimatedDeath
                }
            })
            .sort((a, b) => a.start - b.start)
    }, [persons, rootId, livingThreshold])

    const minYear = Math.min(...timelineData.map(d => d.start)) - 10
    // Extend max year if we have estimated deaths in the future
    const maxDataYear = Math.max(...timelineData.map(d => d.end));
    const maxYear = Math.max(new Date().getFullYear() + 5, maxDataYear + 5);
    
    const totalYears = maxYear - minYear
    
    // Ensure sufficient width for readability
    // User requested larger width for readability.
    const minPxPerYear = 5; 
    const contentWidth = Math.max(width, totalYears * minPxPerYear);
    const contentHeight = timelineData.length * 28 + 60;
    const pxPerYear = contentWidth / totalYears

    return (
        <ZoomPanContainer 
            scale={scale} 
            contentWidth={contentWidth} 
            contentHeight={contentHeight}
            className="bg-slate-50 border rounded"
            contentRef={contentRef}
        >
             <div style={{ width: contentWidth, height: contentHeight, position: 'relative', paddingTop: '20px' }}>
                {/* Axis */}
                <div className="absolute top-5 left-0 right-0 h-8 border-b border-slate-300 flex text-xs text-slate-500">
                    {Array.from({ length: Math.ceil(totalYears / 10) }).map((_, i) => (
                        <div key={i} className="absolute border-l border-slate-300 h-2" style={{ left: (i * 10 * pxPerYear) }}>
                            <span className="absolute -top-4 -left-3 whitespace-nowrap">{minYear + (i * 10)}</span>
                        </div>
                    ))}
                </div>
                
                {/* Bars */}
                {timelineData.map((d, i) => (
                    <div key={d.person.id} style={{ position: 'absolute', top: 50 + (i * 28), width: '100%' }}>
                        <div 
                            onClick={() => onSelect(d.person.id)}
                            className={`absolute h-6 rounded px-2 text-xs flex items-center cursor-pointer hover:ring-2 ring-indigo-300 whitespace-nowrap overflow-hidden transition-all
                                ${d.type === 'root' ? 'bg-indigo-500 text-white z-10' : d.person.gender === 'F' ? 'bg-rose-200 text-rose-900' : 'bg-sky-200 text-sky-900'}
                            `}
                            style={{
                                left: (d.start - minYear) * pxPerYear,
                                width: Math.max(2, (d.end - d.start) * pxPerYear),
                                opacity: 0.9
                            }}
                            title={`${d.person.lastName} ${d.person.firstName} (${d.start} - ${d.end})`}
                        >
                            <span className="uppercase font-bold mr-1">{d.person.lastName}</span> {d.person.firstName}
                        </div>
                        {/* Dates on the right */}
                        <div 
                            className="absolute text-xs text-slate-500 ml-2 flex items-center h-6"
                            style={{
                                left: ((d.end - minYear) * pxPerYear) + 5,
                            }}
                        >
                            {d.start} - {d.isLiving && d.end === new Date().getFullYear() ? '...' : (d.end + (d.isEstimatedDeath ? ' ?' : ''))}
                        </div>
                    </div>
                ))}
            </div>
        </ZoomPanContainer>
    )
}
