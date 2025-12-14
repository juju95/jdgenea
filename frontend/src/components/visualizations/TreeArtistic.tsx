import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import type { ChartProps } from './utils'
import type { Person } from '../../types/person'

export type ArtisticStyle = 'botanical' | 'radial' | 'horizontal'

export const TreeArtistic: React.FC<ChartProps & { style?: ArtisticStyle }> = ({ persons, rootId, onSelect, width = 1200, height = 900, style = 'botanical' }) => {
    const svgRef = useRef<SVGSVGElement>(null)

    // Build Hierarchy Data (Ancestors)
    const hierarchyData = useMemo(() => {
        if (!rootId) return null
        
        // Map for quick access
        const personMap = new Map(persons.map(p => [p.id, p]))
        
        // Recursive build for Ancestors
        const buildAncestors = (pId: string, depth: number = 0): any => {
            const person = personMap.get(pId)
            if (!person || depth > 8) return null // Limit depth to prevent performance issues
            
            const node: any = { ...person, children: [] }
            
            // Parents
            // For tree layout, children array usually implies "sub-branches". 
            // For ancestors, "children" in the data structure are actually parents.
            if (person.fatherId) {
                const father = buildAncestors(person.fatherId, depth + 1)
                if (father) node.children.push(father)
            }
            if (person.motherId) {
                const mother = buildAncestors(person.motherId, depth + 1)
                if (mother) node.children.push(mother)
            }
            
            // If no parents found (leaf in this context), ensure children is empty array or null? 
            // D3 handles empty array fine.
            
            return node
        }
        
        return buildAncestors(rootId)
    }, [persons, rootId])

    useEffect(() => {
        if (!hierarchyData || !svgRef.current) return
        
        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()
        
        // Create root hierarchy
        const root = d3.hierarchy(hierarchyData)
        
        const g = svg.append('g')
        
        // --- STYLES ---
        
        if (style === 'botanical') {
            // Bottom-Up Tree
            // We use d3.tree but flip Y
            const margin = { top: 50, right: 50, bottom: 50, left: 50 }
            const innerWidth = width - margin.left - margin.right
            const innerHeight = height - margin.top - margin.bottom
            
            const treeLayout = d3.tree().size([innerWidth, innerHeight])
            treeLayout(root)
            
            // Flip Y coordinates to make it grow upwards
            root.each(d => {
                // @ts-ignore
                d.y = innerHeight - d.y
            })
            
            // Center the group
            g.attr('transform', `translate(${margin.left}, ${margin.top})`)
            
            // Links (Curved)
            g.selectAll('.link')
                .data(root.links())
                .enter().append('path')
                .attr('class', 'link')
                .attr('fill', 'none')
                .attr('stroke', '#8B4513')
                .attr('stroke-width', d => Math.max(1, 4 - d.target.depth))
                .attr('d', d3.linkVertical()
                    // @ts-ignore
                    .x(d => d.x)
                    // @ts-ignore
                    .y(d => d.y)
                )
                
            // Nodes
            const nodes = g.selectAll('.node')
                .data(root.descendants())
                .enter().append('g')
                .attr('class', 'node')
                // @ts-ignore
                .attr('transform', d => `translate(${d.x},${d.y})`)
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                    // @ts-ignore
                    onSelect(d.data.id)
                })

            // Leaf styling
            nodes.append('circle')
                .attr('r', 5)
                .attr('fill', d => d.depth === 0 ? '#ef4444' : '#22c55e') // Root red, ancestors green
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                
            // Labels
            const labels = nodes.append('text')
                .attr('dy', d => d.children ? 20 : -10) // Below if it has children (parents), above if leaf
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#333')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')
            
            labels.append('tspan')
                .text(d => {
                     // @ts-ignore
                     const p = d.data
                     const name = `${p.lastName} ${p.firstName}`
                     const b = p.birthDateOriginal || (p.birthDate ? p.birthDate.substring(0, 4) : '');
                     const dea = p.deathDateOriginal || (p.deathDate ? p.deathDate.substring(0, 4) : '');
                     
                     let dateStr = '';
                     if (b && !dea) dateStr = b;
                     else if (b && dea) dateStr = `${b}-${dea}`;
                     
                     return dateStr ? `${name} (${dateStr})` : name;
                })
                .attr('x', 0)
                
            labels.append('tspan')
                .text(d => {
                    // @ts-ignore
                    const p = d.data
                    const b = p.birthDateOriginal || (p.birthDate ? p.birthDate.substring(0, 4) : '');
                    const dea = p.deathDateOriginal || (p.deathDate ? p.deathDate.substring(0, 4) : '');
                    if (!b && !dea) return '';
                    if (b && !dea) return `(${b})`;
                    return `(${b} - ${dea})`;
                })
                .attr('x', 0)
                .attr('dy', '1.1em')
                .style('font-size', '8px')
                .style('fill', '#555')
                
        } else if (style === 'radial') {
            // Radial Tree
            const radius = Math.min(width, height) / 2 - 80
            
            const treeLayout = d3.tree()
                .size([2 * Math.PI, radius])
                .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
                
            treeLayout(root)
            
            g.attr('transform', `translate(${width/2},${height/2})`)
            
            // Links
            g.selectAll('.link')
                .data(root.links())
                .enter().append('path')
                .attr('class', 'link')
                .attr('fill', 'none')
                .attr('stroke', '#ccc')
                .attr('stroke-width', 1.5)
                .attr('d', d3.linkRadial()
                    .angle(d => (d as any).x)
                    .radius(d => (d as any).y)
                )
                
            // Nodes
            const nodes = g.selectAll('.node')
                .data(root.descendants())
                .enter().append('g')
                .attr('class', 'node')
                .attr('transform', d => `
                    rotate(${(d as any).x * 180 / Math.PI - 90})
                    translate(${(d as any).y},0)
                `)
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                    // @ts-ignore
                    onSelect(d.data.id)
                })
                
            nodes.append('circle')
                .attr('r', 4)
                .attr('fill', d => d.depth === 0 ? '#ef4444' : '#3b82f6')
                
            nodes.append('text')
                .attr('dy', '0.31em')
                .attr('x', d => (d as any).x < Math.PI === !d.children ? 6 : -6)
                .attr('text-anchor', d => (d as any).x < Math.PI === !d.children ? 'start' : 'end')
                .attr('transform', d => (d as any).x >= Math.PI ? 'rotate(180)' : null)
                .text(d => {
                     // @ts-ignore
                     return `${d.data.lastName} ${d.data.firstName}`
                })
                .style('font-size', '10px')
                .style('fill', '#333')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')

        } else if (style === 'horizontal') {
            // Horizontal Tree (Left to Right)
             const margin = { top: 20, right: 120, bottom: 20, left: 120 }
            const innerWidth = width - margin.left - margin.right
            const innerHeight = height - margin.top - margin.bottom
            
            const treeLayout = d3.tree().size([innerHeight, innerWidth])
            treeLayout(root)
            
            g.attr('transform', `translate(${margin.left}, ${margin.top})`)
            
            // Links
            g.selectAll('.link')
                .data(root.links())
                .enter().append('path')
                .attr('class', 'link')
                .attr('fill', 'none')
                .attr('stroke', '#555')
                .attr('stroke-width', 1.5)
                .attr('d', d3.linkHorizontal()
                    // @ts-ignore
                    .x(d => d.y) // Swap x and y for horizontal
                    // @ts-ignore
                    .y(d => d.x)
                )
                
            // Nodes
            const nodes = g.selectAll('.node')
                .data(root.descendants())
                .enter().append('g')
                .attr('class', 'node')
                // @ts-ignore
                .attr('transform', d => `translate(${d.y},${d.x})`)
                .style('cursor', 'pointer')
                .on('click', (event, d) => {
                    // @ts-ignore
                    onSelect(d.data.id)
                })

            nodes.append('circle')
                .attr('r', 4)
                .attr('fill', d => d.depth === 0 ? '#ef4444' : '#8b5cf6')
                
            nodes.append('text')
                .attr('dy', 3)
                .attr('x', d => d.children ? -8 : 8)
                .attr('text-anchor', d => d.children ? 'end' : 'start')
                .text(d => {
                     // @ts-ignore
                     return `${d.data.lastName} ${d.data.firstName}`
                })
                .style('font-size', '10px')
                .style('fill', '#333')
                .style('text-shadow', '0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff')
        }
        
    }, [hierarchyData, style, width, height, onSelect])

    if (!rootId) {
        return <div className="flex items-center justify-center h-full text-slate-400">Sélectionnez une personne centrale</div>
    }

    return (
        <div className="relative w-full h-full group">
            <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto" style={{ overflow: 'visible' }} />
        </div>
    )
}
