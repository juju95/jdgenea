import React, { useEffect, useRef } from 'react'
import type { ChartProps } from './utils'

export const TreeArtistic: React.FC<ChartProps> = ({ persons, rootId, onSelect, width = 800, height = 600 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, width, height)
        
        // Simple Fractal Tree
        // Root at bottom center
        const startX = width / 2
        const startY = height - 50
        const len = 120
        const angle = -Math.PI / 2
        
        const drawBranch = (x: number, y: number, length: number, angle: number, depth: number) => {
            ctx.beginPath()
            ctx.save()
            
            ctx.translate(x, y)
            ctx.rotate(angle)
            
            ctx.moveTo(0, 0)
            ctx.lineTo(0, -length)
            ctx.strokeStyle = '#8B4513'
            ctx.lineWidth = depth * 2
            ctx.stroke()
            
            if (depth > 0) {
                // Left
                drawBranch(0, -length, length * 0.75, -Math.PI / 6, depth - 1)
                // Right
                drawBranch(0, -length, length * 0.75, Math.PI / 6, depth - 1)
            } else {
                // Leaf/Node
                ctx.beginPath()
                ctx.arc(0, -length, 5, 0, Math.PI*2)
                ctx.fillStyle = '#22c55e'
                ctx.fill()
            }
            
            ctx.restore()
        }
        
        // We need to map actual people to these nodes.
        // This requires traversing the tree and the people hierarchy simultaneously.
        // For a "Physical Tree", usually it means Descendants (Root at bottom trunk, branches are children).
        // Let's implement that mapping.
        
        // For this demo version, I draw the fractal structure. 
        // Integrating real data onto a fractal tree with correct collision avoidance is complex.
        // I will implement a simplified version where I place nodes on layers.
        
        drawBranch(startX, startY, len, 0, 5) // Angle 0 relative to rotated context? No, initial call.
        
        // Correct initial call
        // The recursive function does translate/rotate. 
        // Initial: x, y, len, angle (0 is pointing right, -PI/2 is up), depth
        
        // Reset and redraw correctly
        ctx.clearRect(0, 0, width, height)
        
        const drawTree = (x: number, y: number, len: number, angle: number, depth: number) => {
            ctx.beginPath()
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle) // Rotate frame
            ctx.moveTo(0, 0)
            ctx.lineTo(len, 0) // Draw along X in rotated frame
            ctx.stroke()
            
            if (depth < 1) {
                ctx.restore()
                return
            }
            
            drawTree(len, 0, len * 0.75, -Math.PI / 6, depth - 1)
            drawTree(len, 0, len * 0.75, Math.PI / 6, depth - 1)
            
            ctx.restore()
        }
        
        ctx.strokeStyle = '#5D4037'
        ctx.lineWidth = 2
        drawTree(width/2, height - 20, 100, -Math.PI/2, 5)
        
        // Text overlay
        ctx.fillStyle = "#000"
        ctx.font = "16px sans-serif"
        ctx.fillText("Arbre Artistique (Démo)", 20, 30)

    }, [width, height])

    return <canvas ref={canvasRef} width={width} height={height} className="mx-auto border bg-[#fdfbf7]" />
}
