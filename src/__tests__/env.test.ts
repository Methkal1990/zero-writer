describe("env utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear the env vars that are set in jest.setup.js
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getAllowedOrigins", () => {
    it("returns default origin when ALLOWED_ORIGINS is not set", () => {
      delete process.env.ALLOWED_ORIGINS;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual(["http://localhost:3000"]);
    });

    it("returns default origin when ALLOWED_ORIGINS is empty", () => {
      process.env.ALLOWED_ORIGINS = "";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual(["http://localhost:3000"]);
    });

    it("returns default origin when ALLOWED_ORIGINS is only whitespace", () => {
      process.env.ALLOWED_ORIGINS = "   ";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual(["http://localhost:3000"]);
    });

    it("parses single origin correctly", () => {
      process.env.ALLOWED_ORIGINS = "https://example.com";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual(["https://example.com"]);
    });

    it("parses multiple origins separated by spaces", () => {
      process.env.ALLOWED_ORIGINS =
        "https://example.com https://app.example.com http://localhost:3000";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual([
        "https://example.com",
        "https://app.example.com",
        "http://localhost:3000",
      ]);
    });

    it("handles extra whitespace and filters empty strings", () => {
      process.env.ALLOWED_ORIGINS =
        "  https://example.com   https://app.example.com  ";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual([
        "https://example.com",
        "https://app.example.com",
      ]);
    });

    it("handles mixed whitespace characters", () => {
      process.env.ALLOWED_ORIGINS =
        "https://example.com\thttps://app.example.com\nhttp://localhost:3000";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      const result = env.getAllowedOrigins("http://localhost:3000");
      expect(result).toEqual([
        "https://example.com",
        "https://app.example.com",
        "http://localhost:3000",
      ]);
    });
  });

  describe("client env validation", () => {
    it("uses defaults when env vars are not set", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.NEXT_PUBLIC_APP_ENV;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      expect(env.client.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
      expect(env.client.NEXT_PUBLIC_APP_ENV).toBe("development");
      expect(env.client.NEXT_PUBLIC_SUPABASE_URL).toBe(
        "http://localhost:54321"
      );
      expect(env.client.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(
        "placeholder-anon-key"
      );
    });

    it("uses provided env vars when available", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://myapp.com";
      process.env.NEXT_PUBLIC_APP_ENV = "production";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproject.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "real-anon-key";

      // Need to re-import to get updated env
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env: newEnv } = require("../env");

      expect(newEnv.client.NEXT_PUBLIC_SITE_URL).toBe("https://myapp.com");
      expect(newEnv.client.NEXT_PUBLIC_APP_ENV).toBe("production");
      expect(newEnv.client.NEXT_PUBLIC_SUPABASE_URL).toBe(
        "https://myproject.supabase.co"
      );
      expect(newEnv.client.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("real-anon-key");
    });
  });

  describe("server env validation", () => {
    it("uses defaults when env vars are not set", () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ALLOWED_ORIGINS;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env } = require("../env");
      expect(env.server.OPENAI_API_KEY).toBe("");
      expect(env.server.ALLOWED_ORIGINS).toBeUndefined();
    });

    it("uses provided env vars when available", () => {
      process.env.OPENAI_API_KEY = "sk-test-key";
      process.env.ALLOWED_ORIGINS = "https://example.com";

      // Need to re-import to get updated env
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { env: newEnv } = require("../env");

      expect(newEnv.server.OPENAI_API_KEY).toBe("sk-test-key");
      expect(newEnv.server.ALLOWED_ORIGINS).toBe("https://example.com");
    });
  });
});
