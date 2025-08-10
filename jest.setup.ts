import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/",
}));

// Add global polyfills for Next.js APIs in tests
require("whatwg-fetch");

// Mock NextRequest and NextResponse for testing
global.NextRequest = class MockNextRequest {
  url: string;
  method: string;
  headers: { get: (name: string) => string | null };
  body?: any;
  json?: () => Promise<any>;
  nextUrl: { pathname: string };

  constructor(url: any, options: any = {}) {
    this.url = url;
    this.method = options.method || "GET";
    this.headers = {
      get: (name: string) => {
        if (options.headers) {
          return (
            options.headers[name] || options.headers[name.toLowerCase()] || null
          );
        }
        return null;
      },
    };
    this.body = options.body;
    if (options.body && typeof options.body === "string") {
      this.json = () => Promise.resolve(JSON.parse(options.body));
    }
    // Add nextUrl with pathname for route handlers
    this.nextUrl = {
      pathname: new URL(url).pathname,
    };
  }
} as any;

global.NextResponse = {
  json: function (data, options = {}) {
    const status = options.status || 200;
    return {
      json: () => Promise.resolve(data),
      status: status,
      headers: new Map(),
      ok: status >= 200 && status < 300,
    };
  },
  next: () => undefined,
};

// Location mocking is handled per-test to avoid global issues

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
process.env.OPENAI_API_KEY = "test-openai-key";
