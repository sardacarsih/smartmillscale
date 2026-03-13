/**
 * Custom hook for intervals with proper cleanup
 */
import { useEffect, useRef } from 'react'

/**
 * Hook that sets up an interval and cleans it up automatically
 * @param {function} callback - Function to call on each interval
 * @param {number|null} delay - Delay in milliseconds (null to pause)
 */
export const useInterval = (callback, delay) => {
  const savedCallback = useRef()

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    if (delay === null) {
      return
    }

    const tick = () => {
      savedCallback.current()
    }

    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}

export default useInterval
