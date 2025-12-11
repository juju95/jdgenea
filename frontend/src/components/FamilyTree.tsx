import React, { memo, useMemo, useEffect, useRef, forwardRef } from 'react'
import ReactFamilyTree from 'react-family-tree'
import calcTree from 'relatives-tree'
import { CheckCircle2, AlertCircle, XCircle, Image as ImageIcon } from 'lucide-react'
import type { FamilyNode } from '../utils/familyTreeData'
import { computeIsLiving } from '../utils/personUtils'

const NODE_WIDTH = 240
const NODE_HEIGHT = 100

interface Props {
  nodes: FamilyNode[]
  rootId: string
  onSelect: (id: string) => void
  scale?: number
  livingThreshold?: number
}

export const FamilyTree = memo(forwardRef<HTMLDivElement, Props>(function FamilyTree({ nodes, rootId, onSelect, scale = 1, livingThreshold = 100 }, ref) {
  const localRef = useRef<HTMLDivElement>(null)
  const containerRef = (ref as React.RefObject<HTMLDivElement>) || localRef
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const valid = useMemo(() => nodes.some(n => n.id === rootId), [nodes, rootId])
  
  // Drag to scroll logic
  const [isDragging, setIsDragging] = React.useState(false)
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const hasDraggedRef = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    hasDraggedRef.current = false
    setIsDragging(true)
    setStartPos({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return
    e.preventDefault()
    const dx = e.clientX - startPos.x
    const dy = e.clientY - startPos.y
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasDraggedRef.current = true
    }
    
    scrollContainerRef.current.scrollLeft = startPos.scrollLeft - dx
    scrollContainerRef.current.scrollTop = startPos.scrollTop - dy
  }
  
  const handleNodeClick = (id: string) => {
      if (hasDraggedRef.current) return
      onSelect(id)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  // Calculate tree structure just for dimensions/scrolling logic
  const { canvas } = useMemo(() => {
    // If no root, return empty
    if (!nodes.find(n => n.id === rootId)) {
        return { canvas: { width: 0, height: 0 } }
    }
    // We import calcTree only to get dimensions.
    return calcTree(nodes, {
      rootId,
      nodeWidth: NODE_WIDTH,
      nodeHeight: NODE_HEIGHT,
      placeholders: true,
    })
  }, [nodes, rootId])

  // Scroll to root on mount
  useEffect(() => {
    // Wait for render
    setTimeout(() => {
        const rootEl = document.getElementById(`node-${rootId}`)
        // We scroll the container (outer div) to center the element
        // Since element is inside scaled div, scrollIntoView might work if 'behavior' is smooth
        // But better to use the scrollContainerRef if possible.
        // However, standard scrollIntoView works well in most browsers even with transforms.
        if (rootEl) {
            rootEl.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
        }
    }, 100)
  }, [rootId, valid])

  if (!valid) return <div className="p-4 text-slate-400">Racine introuvable</div>

  return (
    <div 
        ref={scrollContainerRef}
        className={`relative w-full h-full overflow-auto bg-slate-50 border border-slate-200 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
    >
      <div 
        className="relative origin-top-left"
        style={{
            width: canvas.width * (NODE_WIDTH / 2) * scale,
            height: canvas.height * (NODE_HEIGHT / 2) * scale,
        }}
      >
        <div 
            ref={containerRef}
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: canvas.width * (NODE_WIDTH / 2),
                height: canvas.height * (NODE_HEIGHT / 2)
            }}
        >
        <ReactFamilyTree
            nodes={nodes}
            rootId={rootId}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            renderNode={(node) => (
                <FamilyNodeComponent
                    key={node.id}
                    node={node}
                    onSelect={handleNodeClick}
                    isRoot={node.id === rootId}
                    livingThreshold={livingThreshold}
                    style={{
                        width: NODE_WIDTH,
                        height: NODE_HEIGHT,
                        transform: `translate(${node.left * (NODE_WIDTH / 2)}px, ${node.top * (NODE_HEIGHT / 2)}px)`,
                    }}
                />
            )}
        />
        </div>
      </div>
    </div>
  )
}))

interface ExtNode extends FamilyNode {
  top: number
  left: number
  hasSubTree: boolean
}

const FamilyNodeComponent = ({ node, onSelect, isRoot, style, livingThreshold }: { node: ExtNode, onSelect: (id:string)=>void, isRoot: boolean, style: React.CSSProperties, livingThreshold: number }) => {
  const { data } = node
  
  // Status logic
  const hasBirth = !!(data.birthDate && data.birthPlace && data.birthPlace.trim())
  const hasDeath = !!(data.deathDate && data.deathPlace && data.deathPlace.trim())
  // Strict boolean check to avoid issues with truthy strings (e.g. "false") or numbers
  const isLiving = computeIsLiving(data, livingThreshold)
  
  let StatusIcon = XCircle
  let statusColor = "text-red-500"
  
  if (hasBirth && (isLiving || hasDeath)) {
    StatusIcon = CheckCircle2
    statusColor = "text-green-500"
  } else if (hasBirth || hasDeath || data.birthDate || data.deathDate) {
    StatusIcon = AlertCircle
    statusColor = "text-orange-500"
  }

  return (
    <div
      id={`node-${node.id}`}
      className={`absolute flex items-center justify-center p-2`}
      style={{ ...style, zIndex: 10 }}
    >
      <div 
        className={`
          relative w-full h-full bg-white rounded-xl shadow-sm border-2 
          flex flex-col justify-center px-4 py-2 cursor-pointer hover:shadow-md hover:scale-105 transition-transform
          ${isRoot ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}
          ${node.gender === 'female' ? 'hover:border-rose-300' : 'hover:border-sky-300'}
        `}
        onClick={() => onSelect(node.id)}
      >
        {/* Status Icon (Top Left) */}
        <div className="absolute top-1 left-1" title={statusColor === "text-green-500" ? "Complet" : statusColor === "text-orange-500" ? "Partiel" : "Incomplet"}>
          <StatusIcon size={14} className={statusColor} />
        </div>

        {/* Top Right: Media & Sosa */}
        <div className="absolute top-0 right-0 flex items-start">
          {data.mediaCount && data.mediaCount > 0 && (
            <div className="mr-1 mt-1 text-slate-400" title={`${data.mediaCount} média(s)`}>
              <ImageIcon size={14} />
            </div>
          )}
          
          {data.sosa && (
            <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-tr-xl rounded-bl-lg border-b border-l border-amber-200" title={`Sosa: ${data.sosa}`}>
              {data.sosa}
            </div>
          )}
        </div>

        <div className="font-bold text-slate-800 truncate" title={`${data.lastName} ${data.firstName}`}>
          <span className="uppercase">{data.lastName}</span> {data.firstName}
        </div>
        <div className="text-xs text-slate-500 mt-1 flex gap-2">
          {data.birthDate && <span>° {new Date(data.birthDate).getFullYear()}</span>}
          {data.deathDate && <span>† {new Date(data.deathDate).getFullYear()}</span>}
        </div>
        <div className={`absolute bottom-2 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded ${node.gender === 'female' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
          {node.gender === 'female' ? 'F' : 'M'}
        </div>
      </div>
    </div>
  )
}
