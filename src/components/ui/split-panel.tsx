'use client'

import * as React from 'react'
import { DragHandleDots2Icon } from '@radix-ui/react-icons'

interface SplitPanelProps {
  children: [React.ReactNode, React.ReactNode]
  defaultSplit?: number
  minSplit?: number
  maxSplit?: number
  className?: string
}

export function SplitPanel({
  children,
  defaultSplit = 50,
  minSplit = 30,
  maxSplit = 70,
  className = '',
}: SplitPanelProps) {
  const [split, setSplit] = React.useState(defaultSplit)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const newSplit = ((e.clientX - containerRect.left) / containerRect.width) * 100

    if (newSplit >= minSplit && newSplit <= maxSplit) {
      setSplit(newSplit)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full overflow-hidden ${className}`}
    >
      <div
        className="relative h-full"
        style={{ width: `${split}%` }}
      >
        {children[0]}
      </div>
      <div
        className="absolute h-[93vh] cursor-col-resize w-px bg-border/50 hover:bg-border"
        style={{ left: `${split}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
      >
      </div>
      <div
        className="relative h-full p-4"
        style={{ width: `${100 - split}%` }}
      >
        {children[1]}
      </div>
    </div>
  )
} 