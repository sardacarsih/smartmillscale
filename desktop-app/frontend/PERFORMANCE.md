# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Smart Mill Scale frontend application.

## Overview

The application includes comprehensive performance optimizations for:
- Code splitting and lazy loading
- Virtual scrolling for large lists
- Image lazy loading
- Debouncing and throttling
- React Query caching
- Bundle optimization

## Performance Utilities

### Location
`src/shared/utils/performance.js`

### Available Utilities

#### Debounce
Delays function execution until after a wait period:
```javascript
import { debounce } from '../shared/utils/performance'

const handleSearch = debounce((query) => {
  performSearch(query)
}, 300)
```

#### Throttle
Limits function execution to once per time period:
```javascript
import { throttle } from '../shared/utils/performance'

const handleScroll = throttle(() => {
  updateScrollPosition()
}, 100)
```

#### Memory Cache
In-memory caching with TTL:
```javascript
import { memoryCache } from '../shared/utils/performance'

// Set cache with 5 minute TTL
memoryCache.set('user-data', userData, 300000)

// Get from cache
const data = memoryCache.get('user-data')
```

#### Lazy Load Images
```javascript
import { lazyLoadImage } from '../shared/utils/performance'

const img = document.querySelector('img[data-src]')
lazyLoadImage(img)
```

#### Performance Metrics
```javascript
import { getPerformanceMetrics } from '../shared/utils/performance'

const metrics = getPerformanceMetrics()
console.log('Page load time:', metrics.pageLoadTime)
console.log('Time to first byte:', metrics.timeToFirstByte)
```

## Custom Hooks

### useDebounce
Debounces a value:
```javascript
import { useDebounce } from '../shared/hooks/useDebounce'

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)

  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch)
    }
  }, [debouncedSearch])
}
```

### useThrottle
Throttles a value:
```javascript
import { useThrottle } from '../shared/hooks/useThrottle'

function ScrollComponent() {
  const [scrollPos, setScrollPos] = useState(0)
  const throttledPos = useThrottle(scrollPos, 100)

  useEffect(() => {
    updateUI(throttledPos)
  }, [throttledPos])
}
```

### useIntersectionObserver
Detects element visibility:
```javascript
import { useIntersectionObserver } from '../shared/hooks/useIntersectionObserver'

function LazyComponent() {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  })

  return (
    <div ref={targetRef}>
      {isIntersecting && <ExpensiveComponent />}
    </div>
  )
}
```

## Optimized Components

### VirtualList
Renders large lists efficiently using virtual scrolling:
```javascript
import { VirtualList } from '../shared/components/VirtualList'

function MyList({ items }) {
  return (
    <VirtualList
      items={items}
      itemHeight={50}
      containerHeight={400}
      renderItem={(item, index) => (
        <div className="p-3">{item.name}</div>
      )}
    />
  )
}
```

**Features**:
- Only renders visible items
- Configurable overscan for smooth scrolling
- Automatic scroll handling
- Optimized with requestAnimationFrame

### LazyImage
Lazy loads images as they enter viewport:
```javascript
import { LazyImage } from '../shared/components/LazyImage'

function Gallery() {
  return (
    <LazyImage
      src="/path/to/image.jpg"
      alt="Description"
      className="w-full h-auto"
    />
  )
}
```

**Features**:
- Intersection Observer API
- Placeholder support
- Smooth fade-in transition
- 50px rootMargin for preloading

## React Query Configuration

### Location
`src/config/reactQuery.config.js`

### Optimized Settings
```javascript
{
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      cacheTime: 10 * 60 * 1000,       // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      structuralSharing: true,         // Reduce re-renders
      keepPreviousData: true,          // Smooth transitions
    }
  }
}
```

## Build Optimizations

### Vite Configuration

#### Code Splitting
```javascript
manualChunks: {
  'vendor-react': ['react', 'react-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-charts': ['recharts'],
  'vendor-router': ['react-router-dom'],
  'vendor-state': ['zustand'],
}
```

#### Minification
- Terser minification
- Remove console.logs in production
- Remove debuggers

#### Dependency Optimization
- Pre-bundled dependencies
- Optimized dev server warmup
- ESBuild for fast transpilation

## Best Practices

### 1. Component Optimization

#### Use React.memo for Pure Components
```javascript
import { memo } from 'react'

const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* Render data */}</div>
})
```

#### Use useMemo for Expensive Calculations
```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

#### Use useCallback for Event Handlers
```javascript
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### 2. List Rendering

For lists with **< 100 items**: Use regular mapping
```javascript
{items.map(item => <ListItem key={item.id} item={item} />)}
```

For lists with **100+ items**: Use VirtualList
```javascript
<VirtualList
  items={items}
  renderItem={(item) => <ListItem item={item} />}
/>
```

### 3. Image Optimization

Always use LazyImage for images below the fold:
```javascript
<LazyImage src={image.url} alt={image.alt} />
```

### 4. State Management

#### Avoid unnecessary re-renders
```javascript
// ❌ Bad: Updates entire state
const [state, setState] = useState({ a: 1, b: 2 })
setState({ ...state, a: 2 })

// ✅ Good: Use separate states
const [a, setA] = useState(1)
const [b, setB] = useState(2)
setA(2)
```

#### Use Zustand for global state
```javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

### 5. Data Fetching

#### Use React Query for server state
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,
})
```

#### Prefetch data on hover
```javascript
const queryClient = useQueryClient()

const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })
}
```

### 6. Event Handlers

#### Debounce search inputs
```javascript
const debouncedSearch = useDebounce(searchTerm, 300)
useEffect(() => {
  if (debouncedSearch) performSearch(debouncedSearch)
}, [debouncedSearch])
```

#### Throttle scroll handlers
```javascript
const handleScroll = throttle((e) => {
  updateScrollPosition(e.target.scrollTop)
}, 100)
```

#### Use passive listeners for scroll/touch
```javascript
import { addPassiveEventListener } from '../shared/utils/performance'

addPassiveEventListener(element, 'scroll', handleScroll)
```

## Performance Monitoring

### Track Performance Metrics
```javascript
import { useAdvancedAnalytics } from '../features/analytics'

function MyPage() {
  const { trackPagePerformance } = useAdvancedAnalytics()

  useEffect(() => {
    trackPagePerformance('my-page')
  }, [])
}
```

### Monitor Slow Connections
```javascript
import { isSlowConnection } from '../shared/utils/performance'

if (isSlowConnection()) {
  // Load lighter version or skip non-critical resources
}
```

## Bundle Analysis

### Analyze Bundle Size
```bash
npm run build
```

Check the build output for:
- Total bundle size
- Individual chunk sizes
- Large dependencies

### Optimization Checklist

- [ ] Code splitting configured
- [ ] Images lazy loaded
- [ ] Large lists virtualized
- [ ] Event handlers debounced/throttled
- [ ] React Query configured
- [ ] Components memoized where needed
- [ ] Production build optimized
- [ ] Console logs removed in production

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | - |
| Time to Interactive | < 3.5s | - |
| Largest Contentful Paint | < 2.5s | - |
| Cumulative Layout Shift | < 0.1 | - |
| Total Blocking Time | < 300ms | - |

## Future Optimizations

- [ ] Service Worker for offline support
- [ ] HTTP/2 Server Push
- [ ] Resource hints (preload, prefetch)
- [ ] WebP image format
- [ ] Brotli compression
- [ ] Tree shaking optimization
- [ ] Dynamic imports for routes
- [ ] Web Workers for heavy computations

---

**Note**: Always measure before and after optimizations to ensure they're effective.
