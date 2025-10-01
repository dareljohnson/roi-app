import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

// Configure React testing environment to support act()
global.IS_REACT_ACT_ENVIRONMENT = true;

// Add Web API polyfills for Next.js API routes
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream

// Mock Web APIs for Next.js API routes
global.fetch = jest.fn()

// Only add Request mock if it doesn't exist (to avoid conflicts with Jest DOM)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      // Use defineProperty to avoid conflicts with NextRequest's getters
      Object.defineProperty(this, 'url', {
        value: typeof input === 'string' ? input : input.url,
        writable: false,
        configurable: true
      })
      this.method = init.method || 'GET'
      this.headers = new Map()
      this.body = init.body || null
      
      if (init.headers) {
        if (init.headers instanceof Map) {
          this.headers = new Map(init.headers)
        } else if (typeof init.headers === 'object') {
          Object.entries(init.headers).forEach(([key, value]) => {
            this.headers.set(key, value)
          })
        }
      }
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'))
    }
    
    text() {
      return Promise.resolve(this.body || '')
    }
  }
}

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.statusText = init.statusText || 'OK'
    this.headers = new Map()
    
    if (init.headers) {
      if (init.headers instanceof Map) {
        this.headers = new Map(init.headers)
      } else if (typeof init.headers === 'object') {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key, value)
        })
      }
    }
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body)
  }
  
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body))
  }
  
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers
      }
    })
  }
}

global.Headers = class Headers {
  constructor(init) {
    this._headers = new Map()
    
    if (init) {
      if (init instanceof Map) {
        this._headers = new Map(init)
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => {
          this._headers.set(key.toLowerCase(), value)
        })
      }
    }
  }
  
  get(name) {
    return this._headers.get(name.toLowerCase())
  }
  
  set(name, value) {
    this._headers.set(name.toLowerCase(), value)
  }
  
  has(name) {
    return this._headers.has(name.toLowerCase())
  }
  
  delete(name) {
    this._headers.delete(name.toLowerCase())
  }
  
  entries() {
    return this._headers.entries()
  }
}

// Configure React DOM testing environment for React 18
if (typeof globalThis !== 'undefined') {
  // Set up proper React 18 concurrent features testing environment
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
}

// Suppress React act warnings in tests - they're expected for async operations
const originalError = console.error;
beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: The current testing environment is not configured to support act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({ id: 'test-property-id' }),
}))

// Mock next-auth/react with proper session structure
const mockSession = {
  data: {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    }
  },
  status: 'authenticated'
}

jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
  SessionProvider: ({ children }) => children
}))

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.NODE_ENV = 'test'

// Polyfill TextEncoder/TextDecoder for Node.js tests (needed for jszip, supertest, etc)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock matchMedia for chart components that might use it, but only if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

// Import jest-dom matchers after all polyfills are set up
require('@testing-library/jest-dom')
}