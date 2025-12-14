import React, { useRef, useState } from 'react'

interface Props {
    children: React.ReactNode
    scale: number
    className?: string
    contentWidth?: number
    contentHeight?: number
    contentRef?: React.Ref<HTMLDivElement>
}

export function ZoomPanContainer({ children, scale, className = '', contentWidth, contentHeight, contentRef }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startPos, setStartPos] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

    const onMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        setIsDragging(true)
        setStartPos({
            x: e.clientX,
            y: e.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        })
        containerRef.current.style.cursor = 'grabbing'
    }

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return
        e.preventDefault()
        const dx = e.clientX - startPos.x
        const dy = e.clientY - startPos.y
        containerRef.current.scrollLeft = startPos.scrollLeft - dx
        containerRef.current.scrollTop = startPos.scrollTop - dy
    }

    const onMouseUp = () => {
        setIsDragging(false)
        if (containerRef.current) containerRef.current.style.cursor = 'grab'
    }

    const onMouseLeave = () => {
        setIsDragging(false)
        if (containerRef.current) containerRef.current.style.cursor = 'grab'
    }

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full overflow-auto bg-base-200/30 flex ${className}`}
            style={{ cursor: 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            <div 
                style={{
                    width: contentWidth ? contentWidth * scale : undefined,
                    height: contentHeight ? contentHeight * scale : undefined,
                    margin: 'auto',
                    flexShrink: 0
                }}
            >
                <div 
                ref={contentRef}
                style={{ 
                    width: contentWidth, 
                    height: contentHeight, 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top left',
                    transition: 'transform 0.1s ease-out' 
                }}>
                    {children}
                </div>
            </div>
        </div>
    )
}
