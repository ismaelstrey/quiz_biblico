// Setup específico para testes de integração (CommonJS)
const { TextEncoder, TextDecoder } = require('util');

// Polyfills para o ambiente de teste
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock do Request e Response para Next.js
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    constructor(url, init = {}) {
      this.url = url;
      this.method = init.method || 'GET';
      this.headers = new Map();
      this.body = init.body;

      if (init.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        }
      }
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body);
    }
  },
  writable: true,
});

Object.defineProperty(global, 'Response', {
  value: class MockResponse {
    constructor(body, init = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map();
      this.body = body;

      if (init.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value);
          });
        }
      }
    }

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }

    async text() {
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body);
    }

    static json(data, init = {}) {
      return new MockResponse(data, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init.headers,
        },
      });
    }
  },
  writable: true,
});

// Mock do Headers
Object.defineProperty(global, 'Headers', {
  value: class MockHeaders extends Map {
    constructor(init) {
      super();
      if (init) {
        if (init instanceof Headers || init instanceof Map) {
          init.forEach((value, key) => {
            this.set(key.toLowerCase(), value);
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.set(key.toLowerCase(), value);
          });
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.set(key.toLowerCase(), value);
          });
        }
      }
    }

    get(key) {
      return super.get(key.toLowerCase()) || null;
    }

    set(key, value) {
      return super.set(key.toLowerCase(), value);
    }

    has(key) {
      return super.has(key.toLowerCase());
    }

    delete(key) {
      return super.delete(key.toLowerCase());
    }
  },
  writable: true,
});

// Mock do fetch
Object.defineProperty(global, 'fetch', {
  value: jest.fn(),
  writable: true,
});

// Mock do crypto para UUIDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
  },
  writable: true,
});
