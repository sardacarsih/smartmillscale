import { afterEach, beforeEach, vi } from 'vitest'

// Test setup file for Vitest
// This file runs before each test file

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const nodeEnv = globalThis.process?.env?.['NODE_ENV']
const vitestDebug = Boolean(globalThis.process?.env?.['VITEST_DEBUG'])

// Setup global test environment
globalThis.console = {
  ...console,
  // Keep error logs for debugging test failures
  error: (...args) => {
    // Only show error logs in test failures
    if (nodeEnv === 'test') {
      originalConsoleError(...args)
    }
  },
  // Suppress log and warn messages during tests unless debugging
  log: (...args) => {
    if (vitestDebug) {
      originalConsoleLog(...args)
    }
  },
  warn: (...args) => {
    if (vitestDebug) {
      originalConsoleWarn(...args)
    }
  }
}

// Mock window and browser APIs that might not be available in test environment
if (typeof window === 'undefined') {
  globalThis.window = {}
}

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
globalThis.localStorage = localStorageMock

// Mock sessionStorage for tests
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
globalThis.sessionStorage = sessionStorageMock

// Mock setTimeout and setInterval for testing
// global.setTimeout = vi.fn()
// global.clearTimeout = vi.fn()
// global.setInterval = vi.fn()
// global.clearInterval = vi.fn()

// Performance API mock
globalThis.performance = {
  now: vi.fn(() => Date.now()),
}

// Mock Date.now for consistent testing
// IMPORTANT: Do NOT override global.Date itself, only mock Date.now()
// Overriding global.Date breaks the Date constructor!
const mockDateNow = new Date('2025-11-18T10:00:00Z').getTime()
// vi.spyOn(Date, 'now').mockImplementation(() => mockDateNow)

// Setup and cleanup for each test
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Reset localStorage and sessionStorage mocks
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()

  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks()
})
