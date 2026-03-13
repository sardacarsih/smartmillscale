/**
 * Performance Utilities
 * Helper functions for performance optimization
 */

/**
 * Debounce function - delays execution until after wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} wait - Minimum time between executions
 * @returns {Function} Throttled function
 */
export const throttle = (func, wait = 300) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

/**
 * Lazy load images when they come into viewport
 * @param {HTMLElement} img - Image element
 */
export const lazyLoadImage = (img) => {
  const src = img.dataset.src
  if (!src) return

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = src
        img.removeAttribute('data-src')
        observer.unobserve(img)
      }
    })
  })

  observer.observe(img)
}

/**
 * Batch multiple DOM updates
 * @param {Function} callback - Function containing DOM updates
 */
export const batchDOMUpdates = (callback) => {
  requestAnimationFrame(() => {
    callback()
  })
}

/**
 * Measure and log component render time
 * @param {string} componentName - Name of component
 * @param {Function} callback - Function to measure
 */
export const measureRenderTime = (componentName, callback) => {
  const start = performance.now()
  callback()
  const end = performance.now()
  console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`)
}

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
export const getPerformanceMetrics = () => {
  const perfData = window.performance.timing
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
  const connectTime = perfData.responseEnd - perfData.requestStart
  const renderTime = perfData.domComplete - perfData.domLoading
  const ttfb = perfData.responseStart - perfData.navigationStart

  return {
    pageLoadTime,
    connectTime,
    renderTime,
    timeToFirstByte: ttfb,
  }
}

/**
 * Preload critical resources
 * @param {string} url - Resource URL
 * @param {string} as - Resource type (script, style, font, etc)
 */
export const preloadResource = (url, as = 'script') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}

/**
 * Cache API responses in memory
 */
class MemoryCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  set(key, value, ttl = 300000) { // default 5 minutes
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  clear() {
    this.cache.clear()
  }

  delete(key) {
    this.cache.delete(key)
  }
}

export const memoryCache = new MemoryCache()

/**
 * Virtual scrolling helper
 * Calculate visible items in a list
 */
export const calculateVisibleItems = (
  scrollTop,
  containerHeight,
  itemHeight,
  totalItems
) => {
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  )

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
  }
}

/**
 * Optimize event listeners with passive flag
 * @param {HTMLElement} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export const addPassiveEventListener = (element, event, handler) => {
  element.addEventListener(event, handler, { passive: true })
}

/**
 * Check if user is on slow connection
 * @returns {boolean} True if connection is slow
 */
export const isSlowConnection = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!connection) return false

  return connection.effectiveType === 'slow-2g' ||
         connection.effectiveType === '2g' ||
         connection.saveData === true
}

/**
 * Prefetch data for next page/route
 * @param {string} url - URL to prefetch
 */
export const prefetchData = async (url) => {
  if (!isSlowConnection()) {
    try {
      await fetch(url, { priority: 'low' })
    } catch (error) {
      console.warn('Prefetch failed:', error)
    }
  }
}

export default {
  debounce,
  throttle,
  lazyLoadImage,
  batchDOMUpdates,
  measureRenderTime,
  getPerformanceMetrics,
  preloadResource,
  memoryCache,
  calculateVisibleItems,
  addPassiveEventListener,
  isSlowConnection,
  prefetchData,
}
