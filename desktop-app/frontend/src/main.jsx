import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './shared'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById('root'))

function render() {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

// Initial render
render()

// Enable HMR for Wails development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Hot reloading...')
    render()
  })
}
