import { GET, PUT } from "../chapters/[id]/route";
import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: (global as unknown as { NextResponse: unknown }).NextResponse,
}));

jest.mock("../../../lib/supabase/server");

// Create mock with proper method chaining
const mockSupabaseClient = {
  auth: { getUser: jest.fn() },
  from: jest.fn().mockImplementation(() => ({
    select: jest.fn().mockImplementation(() => ({
      eq: jest.fn().mockImplementation(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn().mockImplementation(() => ({
      eq: jest.fn(),
    })),
  })),
};

const mockCreateSupabaseRouteHandlerClient =
  createSupabaseRouteHandlerClient as jest.MockedFunction<
    typeof createSupabaseRouteHandlerClient
  >;

// Helper to set up mock chains for different patterns
const setupMockChains = (options: {
  getChapter?: unknown;
  getProject?: unknown;
  updateResult?: unknown;
}) => {
  const { getChapter, getProject, updateResult } = options;

  const mocks: unknown[] = [];

  if (getChapter !== undefined) {
    const chapterMock = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: getChapter, error: null }),
        }),
      }),
    };
    mockSupabaseClient.from.mockReturnValueOnce(chapterMock);
    mocks.push(chapterMock);
  }

  if (getProject !== undefined) {
    const projectMock = {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: getProject, error: null }),
        }),
      }),
    };
    mockSupabaseClient.from.mockReturnValueOnce(projectMock);
    mocks.push(projectMock);
  }

  if (updateResult !== undefined) {
    const updateMock = {
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue(updateResult),
      }),
    };
    mockSupabaseClient.from.mockReturnValueOnce(updateMock);
    mocks.push(updateMock);
  }

  return mocks;
};

describe("/api/chapters/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseRouteHandlerClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );
  });

  describe("GET", () => {
    it("returns chapter data when authorized", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = {
        id: "chapter-456",
        title: "Chapter 1",
        content: "<p>Chapter content</p>",
        project_id: "project-789",
      };
      const mockProject = { id: "project-789", user_id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: mockChapter,
        getProject: mockProject,
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "GET",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: "chapter-456",
        title: "Chapter 1",
        content: "<p>Chapter content</p>",
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "GET",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when chapter is not found", async () => {
      const mockUser = { id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: null, // Chapter not found
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/nonexistent", {
        method: "GET",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Not found" });
    });

    it("returns 403 when user does not own the project", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = {
        id: "chapter-456",
        title: "Chapter 1",
        content: "<p>Chapter content</p>",
        project_id: "project-789",
      };
      const mockProject = { id: "project-789", user_id: "different-user" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: mockChapter,
        getProject: mockProject,
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "GET",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Forbidden" });
    });
  });

  describe("PUT", () => {
    it("updates chapter successfully", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = { id: "chapter-456", project_id: "project-789" };
      const mockProject = { id: "project-789", user_id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock the first call: chapters select
      const mockChapterChain = {
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: mockChapter, error: null }),
        }),
      };

      // Mock the second call: projects select
      const mockProjectChain = {
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: mockProject, error: null }),
        }),
      };

      // Mock the third call: chapters update
      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockChapterChain),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockProjectChain),
        })
        .mockReturnValueOnce({ update: mockUpdateFn });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Chapter Title",
          content: "<p>Updated content</p>",
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
      expect(mockUpdateFn).toHaveBeenCalledWith({
        title: "Updated Chapter Title",
        content: "<p>Updated content</p>",
      });
    });

    it("returns 401 when user is not authenticated", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when chapter is not found", async () => {
      const mockUser = { id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: null, // Chapter not found
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/nonexistent", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Not found" });
    });

    it("returns 403 when user does not own the project", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = { id: "chapter-456", project_id: "project-789" };
      const mockProject = { id: "project-789", user_id: "different-user" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: mockChapter,
        getProject: mockProject,
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({ error: "Forbidden" });
    });

    it("handles database update errors", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = { id: "chapter-456", project_id: "project-789" };
      const mockProject = { id: "project-789", user_id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });
      setupMockChains({
        getChapter: mockChapter,
        getProject: mockProject,
        updateResult: { error: { message: "Database error" } },
      });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "PUT",
        body: JSON.stringify({ title: "Updated Title" }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: "Database error" });
    });

    it("filters out non-string values from updates", async () => {
      const mockUser = { id: "user-123" };
      const mockChapter = { id: "chapter-456", project_id: "project-789" };
      const mockProject = { id: "project-789", user_id: "user-123" };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      // Mock for successful update
      const mockChapterChain = {
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: mockChapter, error: null }),
        }),
      };

      const mockProjectChain = {
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: mockProject, error: null }),
        }),
      };

      const mockUpdateFn = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockChapterChain),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue(mockProjectChain),
        })
        .mockReturnValueOnce({ update: mockUpdateFn });

      const request = new (
        global as unknown as {
          NextRequest: new (...args: unknown[]) => unknown;
        }
      ).NextRequest("http://localhost/api/chapters/chapter-456", {
        method: "PUT",
        body: JSON.stringify({
          title: "Valid Title",
          content: "Valid Content",
          invalidField: 123,
          anotherInvalidField: { nested: "object" },
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await PUT(request as any);

      expect(response.status).toBe(200);
      expect(mockUpdateFn).toHaveBeenCalledWith({
        title: "Valid Title",
        content: "Valid Content",
      });
    });
  });
});
