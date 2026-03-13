/**
 * React Query Configuration
 * Optimized settings for data fetching and caching
 */

export const reactQueryConfig = {
  defaultOptions: {
    queries: {
      // Stale time - how long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time - how long inactive data stays in cache
      cacheTime: 10 * 60 * 1000, // 10 minutes

      // Retry configuration
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,

      // Performance optimizations
      structuralSharing: true, // Reduce re-renders by sharing unchanged data
      keepPreviousData: true, // Keep previous data while fetching new data

      // Suspense and error boundaries
      suspense: false,
      useErrorBoundary: false,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      retryDelay: 1000,

      // Use error boundary for mutations
      useErrorBoundary: false,
    },
  },
}

export default reactQueryConfig
