import { ensureAllowedOrigin } from "../secure-origin";
import { env } from "../../env";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: global.NextResponse,
}));

// Mock the env module
jest.mock("../../env", () => ({
  env: {
    client: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
    getAllowedOrigins: jest.fn(),
  },
}));

const mockGetAllowedOrigins = env.getAllowedOrigins as jest.MockedFunction<
  typeof env.getAllowedOrigins
>;

describe("ensureAllowedOrigin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns nothing when origin is allowed", () => {
    mockGetAllowedOrigins.mockReturnValue([
      "http://localhost:3000",
      "https://example.com",
    ]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "https://example.com",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeUndefined();
  });

  it("returns nothing when no origin header is present", () => {
    mockGetAllowedOrigins.mockReturnValue(["http://localhost:3000"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test"
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeUndefined();
  });

  it("uses referer when origin is not present", () => {
    mockGetAllowedOrigins.mockReturnValue(["https://example.com"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          referer: "https://example.com/page",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeUndefined();
  });

  it("returns 403 when origin is not in allowed list", async () => {
    mockGetAllowedOrigins.mockReturnValue(["http://localhost:3000"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "https://malicious.com",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeDefined();
    expect(result?.status).toBe(403);

    const data = await result?.json();
    expect(data).toEqual({ error: "Forbidden origin" });
  });

  it("returns 400 when origin is not a valid URL", async () => {
    mockGetAllowedOrigins.mockReturnValue(["http://localhost:3000"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "invalid-url",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeDefined();
    expect(result?.status).toBe(400);

    const data = await result?.json();
    expect(data).toEqual({ error: "Invalid origin" });
  });

  it("matches origins correctly by comparing full origins", () => {
    mockGetAllowedOrigins.mockReturnValue(["https://example.com:8080"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "https://example.com:8080",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeUndefined();
  });

  it("rejects origins with different ports", async () => {
    mockGetAllowedOrigins.mockReturnValue(["https://example.com:8080"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "https://example.com:3000",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeDefined();
    expect(result?.status).toBe(403);
  });

  it("handles invalid allowed origins gracefully", () => {
    // Mock getAllowedOrigins to return an invalid URL
    mockGetAllowedOrigins.mockReturnValue([
      "invalid-url",
      "http://localhost:3000",
    ]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "http://localhost:3000",
        },
      }
    );

    const result = ensureAllowedOrigin(request);
    expect(result).toBeUndefined(); // Should still work with valid URL
  });

  it("calls env.getAllowedOrigins with correct default", () => {
    mockGetAllowedOrigins.mockReturnValue(["http://localhost:3000"]);

         // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const request = new (global as any).NextRequest(
      "http://localhost:3000/api/test",
      {
        headers: {
          origin: "http://localhost:3000",
        },
      }
    );

    ensureAllowedOrigin(request);
    expect(mockGetAllowedOrigins).toHaveBeenCalledWith("http://localhost:3000");
  });
});
