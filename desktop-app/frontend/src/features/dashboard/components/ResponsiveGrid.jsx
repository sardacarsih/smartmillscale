/**
 * ResponsiveGrid - Adaptive grid layout component
 * Provides responsive breakpoints for dashboard layouts
 */
import { useState, useEffect } from 'react'

const ResponsiveGrid = ({
  children,
  className = "",
  cols = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = 4
}) => {
  const [screenSize, setScreenSize] = useState('lg')

  useEffect(() => {
    const getScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) return 'xs'
      if (width < 768) return 'sm'
      if (width < 1024) return 'md'
      if (width < 1280) return 'lg'
      return 'xl'
    }

    const handleResize = () => {
      setScreenSize(getScreenSize())
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getColsForScreen = () => {
    return cols[screenSize] || cols.lg || 3
  }

  const getGapClass = () => {
    const gapMap = {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8'
    }
    return gapMap[gap] || 'gap-4'
  }

  const gridCols = getColsForScreen()
  const gridClass = `grid grid-cols-${gridCols} ${getGapClass()} ${className}`

  return (
    <div className={gridClass}>
      {children}
    </div>
  )
}

export const ResponsiveChartGrid = ({ children, className = "" }) => {
  return (
    <ResponsiveGrid
      cols={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 2 }}
      gap={6}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

export const ResponsiveMetricGrid = ({ children, className = "" }) => {
  return (
    <ResponsiveGrid
      cols={{ xs: 1, sm: 2, md: 2, lg: 4, xl: 4 }}
      gap={4}
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

export default ResponsiveGrid