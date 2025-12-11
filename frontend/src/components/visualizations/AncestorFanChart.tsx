import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { buildAncestorHierarchy } from './utils'
import type { ChartProps, HierarchyNode } from './utils'

export const AncestorFanChart: React.FC<ChartProps> = ({ persons, rootId, onSelect, width = 800, height = 600 }) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current || !rootId) return

        const data = buildAncestorHierarchy(persons, rootId, 0, 5) // 5 generations
        if (!data) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const radius = Math.min(width, height) / 2
        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

        const partition = d3.partition<HierarchyNode>()
            .size([2 * Math.PI, radius])

        const root = d3.hierarchy(data)
            // Sort to keep parents together? Usually Fan Chart order is Father (Left/Top) Mother (Right/Bottom)
            // D3 Partition might layout them based on value. We just want equal space per generation.
            .sum(() => 1)
            // We need custom sort to ensure consistent ordering (Father, Mother)
            // But standard fan chart is strict.
            
        partition(root)

        const arc = d3.arc<d3.HierarchyRectangularNode<HierarchyNode>>()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1)

        // Draw Arcs
        g.selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            .attr("d", arc)
            .style("stroke", "#fff")
            .style("fill", d => {
                if (!d.parent) return "#e2e8f0" // Root
                // Color by gender?
                return d.data.gender === 'M' ? "#e0f2fe" : "#ffe4e6"
            })
            .style("cursor", "pointer")
            .on("click", (e, d) => onSelect(d.data.id))
            .append("title")
            .text(d => `${d.data.firstName} ${d.data.lastName}`)

        // Draw Labels
        g.selectAll("text")
            .data(root.descendants().filter(d => (d.x1 - d.x0) > 0.05)) // Only show if arc is wide enough
            .enter().append("text")
            .attr("transform", function(d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .text(d => {
                const name = `${d.data.firstName} ${d.data.lastName}`
                return name.length > 15 ? name.substring(0, 15) + '...' : name
            })
            .style("font-size", "10px")
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .style("fill", "#1e293b")

    }, [persons, rootId, width, height, onSelect])

    return <svg ref={svgRef} width={width} height={height} className="mx-auto" />
}
