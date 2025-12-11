import React, { memo, useMemo, useEffect, useRef, forwardRef } from 'react'
import ReactFamilyTree from 'react-family-tree'
import calcTree from 'relatives-tree'
import type { FamilyNode } from '../utils/familyTreeData'

const NODE_WIDTH = 240
const NODE_HEIGHT = 100

interface Props {
  nodes: FamilyNode[]
  rootId: string
  onSelect: (id: string) => void
  scale?: number
}

export const FamilyTree = memo(forwardRef<HTMLDivElement, Props>(function FamilyTree({ nodes, rootId, onSelect, scale = 1 }, ref) {
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

const FamilyNodeComponent = ({ node, onSelect, isRoot, style }: { node: ExtNode, onSelect: (id:string)=>void, isRoot: boolean, style: React.CSSProperties }) => {
  const { data } = node
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
        <div className="font-bold text-slate-800 truncate" title={`${data.firstName} ${data.lastName}`}>
          {data.firstName} <span className="uppercase">{data.lastName}</span>
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
