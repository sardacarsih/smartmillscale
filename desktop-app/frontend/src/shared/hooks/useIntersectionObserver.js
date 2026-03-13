/**
 * useIntersectionObserver - Custom hook for detecting element visibility
 */
import { useState, useEffect, useRef } from 'react'

export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState(null)
  const targetRef = useRef(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setEntry(entry)
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options,
      }
    )

    observer.observe(target)

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [options])

  return { targetRef, isIntersecting, entry }
}

export default useIntersectionObserver
