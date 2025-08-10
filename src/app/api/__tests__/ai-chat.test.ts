import { POST } from "../ai/chat/route";
import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";
import { ensureAllowedOrigin } from "../../../middleware/secure-origin";
import OpenAI from "openai";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: global.NextResponse,
}));

// Mock dependencies
jest.mock("../../../lib/supabase/server");
jest.mock("../../../middleware/secure-origin");
jest.mock("openai");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  auth: { getUser: jest.fn() },
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
};

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

const mockCreateSupabaseRouteHandlerClient =
  createSupabaseRouteHandlerClient as jest.MockedFunction<
    typeof createSupabaseRouteHandlerClient
  >;
const mockEnsureAllowedOrigin = ensureAllowedOrigin as jest.MockedFunction<
  typeof ensureAllowedOrigin
>;

describe("/api/ai/chat POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseRouteHandlerClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );
    mockEnsureAllowedOrigin.mockReturnValue(undefined);
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => mockOpenAI as any
    );
  });

  it("returns chat response without tool calls", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456", user_id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: mockProject,
      error: null,
    });
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Hello! How can I help with your book?",
            tool_calls: null,
          },
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Hello" }],
          selectedChapterId: null,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ reply: "Hello! How can I help with your book?" });
  });

  it("handles tool calls to read current chapter", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456", user_id: "user-123" };
    const mockChapter = {
      id: "chapter-789",
      title: "Chapter 1",
      content: "<p>Chapter content</p>",
      project_id: "project-456",
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single
      .mockResolvedValueOnce({ data: mockProject, error: null }) // Project check
      .mockResolvedValueOnce({ data: mockChapter, error: null }) // Chapter read
      .mockResolvedValueOnce({ data: mockProject, error: null }); // Project ownership check

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call-123",
                  function: { name: "read_current" },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                "I can see your chapter content. Here are some suggestions...",
            },
          },
        ],
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Help me with this chapter" }],
          selectedChapterId: "chapter-789",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      reply: "I can see your chapter content. Here are some suggestions...",
    });
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when user does not own the project", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456", user_id: "different-user" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: mockProject,
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("handles origin security check", async () => {
    const forbiddenResponse = {
      json: () => Promise.resolve({ error: "Forbidden" }),
      status: 403,
      headers: new Map(),
      ok: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    mockEnsureAllowedOrigin.mockReturnValue(forbiddenResponse);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Hello" }],
        }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mockEnsureAllowedOrigin).toHaveBeenCalledWith(request);
  });

  it("handles no selected chapter when tool call requests it", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456", user_id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: mockProject,
      error: null,
    });

    mockOpenAI.chat.completions.create
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: "call-123",
                  function: { name: "read_current" },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "No chapter is selected to analyze.",
            },
          },
        ],
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = new (global as any).NextRequest(
      "http://localhost/api/ai/chat",
      {
        method: "POST",
        body: JSON.stringify({
          projectId: "project-456",
          messages: [{ role: "user", content: "Analyze this chapter" }],
          selectedChapterId: null,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ reply: "No chapter is selected to analyze." });
  });
});
