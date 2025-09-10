import { TextEncoder, TextDecoder } from 'util';

// Polyfills para o ambiente de teste
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock do Request e Response para Next.js
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    body: any;

    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Map();
      this.body = init?.body;

      if (init?.headers) {
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
            this.headers.set(key.toLowerCase(), value as string);
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
    status: number;
    statusText: string;
    headers: Map<string, string>;
    body: any;

    constructor(body?: any, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Map();
      this.body = body;

      if (init?.headers) {
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
            this.headers.set(key.toLowerCase(), value as string);
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

    static json(data: any, init?: ResponseInit) {
      return new MockResponse(data, {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init?.headers,
        },
      });
    }
  },
  writable: true,
});

// Mock do Headers
Object.defineProperty(global, 'Headers', {
  value: class MockHeaders extends Map<string, string> {
    constructor(init?: HeadersInit) {
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

    get(key: string): string | undefined {
      return super.get(key.toLowerCase()) || undefined;
    }

    set(key: string, value: string): this {
      return super.set(key.toLowerCase(), value);
    }

    has(key: string): boolean {
      return super.has(key.toLowerCase());
    }

    delete(key: string): boolean {
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

export {};
