/**
 * LazyImage - Optimized image component with lazy loading
 */
import { useState, useEffect, useRef } from 'react'

const LazyImage = ({
  src,
  alt = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3C/svg%3E',
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '50px', // Start loading before image enters viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [src])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-50'
      } ${className}`}
      onLoad={handleLoad}
      {...props}
    />
  )
}

export default LazyImage
