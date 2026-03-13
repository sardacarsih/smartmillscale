/**
 * VirtualList - Optimized list component for rendering large datasets
 * Uses virtual scrolling to only render visible items
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { calculateVisibleItems } from '../utils/performance'

const VirtualList = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 3,
  className = '',
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef(null)

  const { startIndex, endIndex } = useMemo(() => {
    const visible = calculateVisibleItems(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length
    )

    return {
      startIndex: Math.max(0, visible.startIndex - overscan),
      endIndex: Math.min(items.length - 1, visible.endIndex + overscan),
    }
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1)
  }, [items, startIndex, endIndex])

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const throttledScroll = (e) => {
      requestAnimationFrame(() => handleScroll(e))
    }

    container.addEventListener('scroll', throttledScroll, { passive: true })
    return () => container.removeEventListener('scroll', throttledScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VirtualList
