import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { buildDescendantHierarchy } from './utils'
import type { ChartProps, HierarchyNode } from './utils'

export const DescendantWheel: React.FC<ChartProps> = ({ persons, rootId, onSelect, width = 800, height = 600 }) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current || !rootId) return

        const data = buildDescendantHierarchy(persons, rootId, 0, 4) // Limit depth
        if (!data) return

        const svg = d3.select(svgRef.current)
        svg.selectAll("*").remove()

        const radius = Math.min(width, height) / 2
        const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`)

        const root = d3.hierarchy(data).sum(() => 1)

        const partition = d3.partition<HierarchyNode>()
            .size([2 * Math.PI, radius])

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
                if (!d.parent) return "#f1f5f9"
                // Color by branch (children of root)
                let ancestor = d
                while(ancestor.parent && ancestor.parent.parent) ancestor = ancestor.parent
                const index = ancestor.parent?.children?.indexOf(ancestor) || 0
                const colors = ["#bae6fd", "#bbf7d0", "#fde68a", "#fbcfe8", "#e9d5ff", "#c7d2fe"]
                return colors[index % colors.length]
            })
            .style("cursor", "pointer")
            .on("click", (e, d) => onSelect(d.data.id))
            .append("title")
            .text(d => `${d.data.firstName} ${d.data.lastName}`)

        // Labels
        g.selectAll("text")
            .data(root.descendants().filter(d => (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10)) // Simple filter
            .enter().append("text")
            .attr("transform", function(d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .text(d => d.data.firstName)
            .style("font-size", "10px")
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .style("fill", "#334155")

    }, [persons, rootId, width, height, onSelect])

    return <svg ref={svgRef} width={width} height={height} className="mx-auto" />
}
