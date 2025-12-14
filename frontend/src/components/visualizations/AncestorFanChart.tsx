import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { buildAncestorHierarchy } from './utils'
import type { ChartProps, HierarchyNode } from './utils'

export const AncestorFanChart: React.FC<ChartProps & { maxDepth?: number, scale?: number }> = ({ persons, rootId, onSelect, width = 800, height = 600, maxDepth = 5, scale = 1 }) => {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current || !rootId) return

        const data = buildAncestorHierarchy(persons, rootId, 0, maxDepth)
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
            .style("stroke", d => d.data.isEmpty ? "none" : "#fff")
            .style("fill", d => {
                if (d.data.isEmpty) return "none"
                if (!d.parent) return "#f8fafc" // Root
                // Color by gender?
                return d.data.gender === 'M' ? "#e0f2fe" : "#ffe4e6"
            })
            .style("cursor", d => d.data.isEmpty ? "default" : "pointer")
            .on("click", (e, d) => {
                if (!d.data.isEmpty && d.data.id) onSelect(d.data.id)
            })
            .append("title")
            .text(d => d.data.isEmpty ? '' : `${d.data.lastName} ${d.data.firstName}`)

        // Draw Labels
        g.selectAll("text")
            .data(root.descendants().filter(d => {
                if (d.data.isEmpty) return false
                return true 
            })) 
            .enter().append("text")
            .attr("transform", function(d) {
                if (d.depth === 0) return "translate(0,0)"
                
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                
                // Depth 1 (Parents): Force Horizontal for readability
                if (d.depth === 1) {
                    // Parents are usually at 90 (Father) and 270 (Mother) roughly?
                    // Or 0-180 and 180-360. Centers at 90 and 270.
                    // We just want them horizontal.
                    // Position at (x,y), then rotate to 0.
                    // transform: rotate(x-90) translate(y,0) rotate(-(x-90))
                    return `rotate(${x - 90}) translate(${y},0) rotate(${-(x - 90)})`;
                }

                // Depth 6+: Radial (Standard)
                if (d.depth >= 6) {
                    const rotate = x >= 180 ? x - 90 + 180 : x - 90;
                    return `rotate(${x - 90}) translate(${y},0) rotate(${rotate - (x - 90)})`;
                }

                // Depth 2-5: Tangential Readable
                // Top Half (x < 90 or x > 270): Rotate 90 deg relative to radius (Text reads Left-to-Right)
                // Bottom Half (90 < x < 270): Rotate -90 deg relative to radius (Text reads Left-to-Right, flipped)
                if (x > 90 && x < 270) {
                    return `rotate(${x - 90}) translate(${y},0) rotate(-90)`;
                } else {
                    return `rotate(${x - 90}) translate(${y},0) rotate(90)`;
                }
            })
            .style("text-anchor", "middle")
            .style("pointer-events", "none")
            .style("fill", "#1e293b")
            .each(function(d) {
                const el = d3.select(this)
                const arcLength = (d.y0 + d.y1) / 2 * (d.x1 - d.x0)
                const ringThickness = d.y1 - d.y0
                
                const lastName = d.data.lastName?.toUpperCase() || "?"
                const firstName = d.data.firstName?.split(' ')[0] || "?"
                
                // Adjust dimensions for Radial vs Horizontal
                let availableWidth, availableHeight;
                
                // Depth 1: Horizontal text
                if (d.depth === 1) {
                    const angle = d.x1 - d.x0;
                    const r = (d.y0 + d.y1) / 2;
                    availableWidth = 2 * r * Math.sin(angle / 2);
                    availableHeight = ringThickness;
                } else if (d.depth >= 6) {
                    // Radial text
                    availableWidth = ringThickness;
                    availableHeight = arcLength;
                } else {
                    // Tangential text
                    availableWidth = arcLength;
                    availableHeight = ringThickness;
                }
                
                // Helper for dates
                const getYears = (p: any) => {
                    const b = p.birthDateOriginal || (p.birthDate ? p.birthDate.substring(0, 4) : '');
                    const dea = p.deathDateOriginal || (p.deathDate ? p.deathDate.substring(0, 4) : '');
                    if (!b && !dea) return '';
                    if (b && !dea) return `° ${b}`;
                    if (!b && dea) return `† ${dea}`;
                    return `${b} - ${dea}`;
                }
                const dateStr = getYears(d.data);

                if (d.depth === 0) {
                    // Root: Special case, circular area
                     el.append("tspan")
                       .text(lastName)
                       .attr("x", 0)
                       .attr("dy", "-0.5em")
                       .style("font-weight", "bold")
                     el.append("tspan")
                       .text(firstName)
                       .attr("x", 0)
                       .attr("dy", "1.2em")
                     if (dateStr) {
                         el.append("tspan")
                           .text(dateStr)
                           .attr("x", 0)
                           .attr("dy", "1.2em")
                           .style("font-size", "0.8em")
                           .style("fill", "#666")
                     }
                     return;
                }

                // Font Size Logic
                // For Tangential (Inner): We have lots of width, height is constrained (ringThickness).
                // Font size should be proportional to Ring Thickness but not too big.
                // ringThickness is usually ~50-100px.
                // We can use 12-14px easily.
                
                // For Radial (Outer): We have limited width (ringThickness), lots of height (arcLength? No, arcLength is tiny there).
                // Actually for outer rings, arcLength is small (e.g. 10px), so we can't stack lines easily.
                // But we have ringThickness (~50px) for the text length.
                
                let fontSize = 11;
                if (d.depth <= 1) {
                    fontSize = 14; 
                } else if (d.depth >= 5) {
                    fontSize = Math.min(10, Math.max(8, ringThickness / 3));
                } else {
                    fontSize = Math.min(12, Math.max(9, ringThickness / 2.5));
                }

                // Adjust for zoom: keep visual size constant when zooming in
                if (scale > 1) {
                    fontSize = fontSize / scale;
                }

                el.style("font-size", `${fontSize}px`)

                const charWidth = fontSize * 0.65;
                const maxChars = Math.floor((availableWidth - 4) / charWidth);

                if (availableWidth < 10) {
                    el.text("");
                    return;
                }

                if (d.depth <= 1) {
                    if (availableHeight > 3.5 * fontSize) {
                        el.append("tspan")
                          .text(lastName)
                          .attr("x", 0)
                          .attr("dy", "-0.8em")
                          .style("font-weight", "bold")
                        el.append("tspan")
                          .text(firstName)
                          .attr("x", 0)
                          .attr("dy", "1.2em")
                        if (dateStr) {
                             el.append("tspan")
                               .text(dateStr)
                               .attr("x", 0)
                               .attr("dy", "1.2em")
                               .style("font-size", "0.85em")
                               .style("fill", "#555")
                        }
                    } else {
                        // Single line or just Name
                         el.text(`${lastName} ${firstName}`)
                           .attr("dy", "0.35em")
                           .style("font-weight", "bold")
                    }
                } else if (d.depth >= 6) {
                    // Level 6+: Single line
                    el.text(`${lastName} ${firstName}`)
                      .attr("dy", "0.35em")
                      .style("font-weight", "bold")
                } else {
                    // Level 2-5: 2 lines (Name), maybe 3rd for date if space
                    const showDate = availableHeight > 2.8 * fontSize;
                    
                    el.append("tspan")
                      .text(lastName)
                      .attr("x", 0)
                      .attr("dy", showDate ? "-0.6em" : "-0.5em")
                      .style("font-weight", "bold")
                    el.append("tspan")
                      .text(firstName)
                      .attr("x", 0)
                      .attr("dy", "1.1em")
                      
                    if (showDate && dateStr) {
                        el.append("tspan")
                          .text(dateStr)
                          .attr("x", 0)
                          .attr("dy", "1.1em")
                          .style("font-size", "0.85em")
                          .style("fill", "#555")
                    }
                }
            })

    }, [persons, rootId, width, height, onSelect])

    return <svg ref={svgRef} width={width} height={height} className="mx-auto" />
}
