import {
  createSupabaseServerClient,
  createSupabaseRouteHandlerClient,
  getRequestOrigin,
} from "../supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

// Mock Next.js modules
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("../../env", () => ({
  env: {
    client: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_SITE_URL: "https://test.com",
    },
  },
}));

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockHeaders = headers as jest.MockedFunction<typeof headers>;
const mockCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>;

describe("Supabase server utilities", () => {
  const mockCookieStore = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockHeaderStore = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCookies.mockResolvedValue(mockCookieStore as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockHeaders.mockResolvedValue(mockHeaderStore as any);
  });

  describe("createSupabaseServerClient", () => {
    it("creates a server client with read-only cookie handlers", async () => {
      const mockClient = { from: jest.fn() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue(mockClient as any);

      const client = await createSupabaseServerClient();

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        {
          cookies: {
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          },
        }
      );
      expect(client).toBe(mockClient);
    });

    it("handles cookie get operations", async () => {
      mockCookieStore.get.mockReturnValue({ value: "test-cookie-value" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseServerClient();

      // Get the cookies config passed to createServerClient
      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;
      const result = cookiesConfig.get("test-cookie");

      expect(mockCookieStore.get).toHaveBeenCalledWith("test-cookie");
      expect(result).toBe("test-cookie-value");
    });

    it("returns undefined when cookie does not exist", async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseServerClient();

      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;
      const result = cookiesConfig.get("nonexistent-cookie");

      expect(result).toBeUndefined();
    });

    it("has no-op set and remove methods for server components", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseServerClient();

      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;

      // These should not throw and return undefined
      expect(() => cookiesConfig.set("test", "value", {})).not.toThrow();
      expect(() => cookiesConfig.remove("test", {})).not.toThrow();
      expect(cookiesConfig.set("test", "value", {})).toBeUndefined();
      expect(cookiesConfig.remove("test", {})).toBeUndefined();
    });
  });

  describe("createSupabaseRouteHandlerClient", () => {
    it("creates a route handler client with cookie modification support", async () => {
      const mockClient = { from: jest.fn() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue(mockClient as any);

      const client = await createSupabaseRouteHandlerClient();

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
        {
          cookies: {
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          },
        }
      );
      expect(client).toBe(mockClient);
    });

    it("handles cookie get operations", async () => {
      mockCookieStore.get.mockReturnValue({ value: "test-cookie-value" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseRouteHandlerClient();

      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;
      const result = cookiesConfig.get("test-cookie");

      expect(mockCookieStore.get).toHaveBeenCalledWith("test-cookie");
      expect(result).toBe("test-cookie-value");
    });

    it("handles cookie set operations", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseRouteHandlerClient();

      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;
      const options = { httpOnly: true, secure: true };
      cookiesConfig.set("test-cookie", "test-value", options);

      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: "test-cookie",
        value: "test-value",
        httpOnly: true,
        secure: true,
      });
    });

    it("handles cookie remove operations", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCreateServerClient.mockReturnValue({} as any);

      await createSupabaseRouteHandlerClient();

      const cookiesConfig =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockCreateServerClient.mock.calls[0][2].cookies as any;
      const options = { httpOnly: true };
      cookiesConfig.remove("test-cookie", options);

      expect(mockCookieStore.set).toHaveBeenCalledWith({
        name: "test-cookie",
        value: "",
        httpOnly: true,
      });
    });
  });

  describe("getRequestOrigin", () => {
    it("returns origin header when present", async () => {
      mockHeaderStore.get.mockReturnValue("https://example.com");

      const origin = await getRequestOrigin();

      expect(mockHeaderStore.get).toHaveBeenCalledWith("origin");
      expect(origin).toBe("https://example.com");
    });

    it("returns site URL when origin header is not present", async () => {
      mockHeaderStore.get.mockReturnValue(null);

      const origin = await getRequestOrigin();

      expect(mockHeaderStore.get).toHaveBeenCalledWith("origin");
      expect(origin).toBe("https://test.com");
    });

    it("returns site URL when origin header is empty", async () => {
      mockHeaderStore.get.mockReturnValue("");

      const origin = await getRequestOrigin();

      expect(mockHeaderStore.get).toHaveBeenCalledWith("origin");
      expect(origin).toBe("https://test.com");
    });
  });
});
