import { POST } from "../projects/route";
import { createSupabaseRouteHandlerClient } from "../../../lib/supabase/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: global.NextResponse,
}));

// Mock the Supabase client
jest.mock("../../../lib/supabase/server", () => ({
  createSupabaseRouteHandlerClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
};

const mockCreateSupabaseRouteHandlerClient =
  createSupabaseRouteHandlerClient as jest.MockedFunction<
    typeof createSupabaseRouteHandlerClient
  >;

describe("/api/projects POST", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseRouteHandlerClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );
  });

  it("creates a project successfully", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: mockProject,
      error: null,
    });

    const request = {
      json: () =>
        Promise.resolve({
          kind: "fiction",
          title: "Test Novel",
          description: "A test description",
          plot: "Test plot",
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "project-456" });
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      kind: "fiction",
      title: "Test Novel",
      description: "A test description",
      plot: "Test plot",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const request = {
      json: () =>
        Promise.resolve({
          kind: "fiction",
          title: "Test Novel",
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("handles database errors", async () => {
    const mockUser = { id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const request = {
      json: () =>
        Promise.resolve({
          kind: "fiction",
          title: "Test Novel",
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database error" });
  });

  it("validates request body schema", async () => {
    const mockUser = { id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const request = {
      json: () =>
        Promise.resolve({
          kind: "invalid-kind", // Invalid enum value
          title: "Test Novel",
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    await expect(POST(request)).rejects.toThrow();
  });

  it("handles optional fields correctly", async () => {
    const mockUser = { id: "user-123" };
    const mockProject = { id: "project-456" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: mockProject,
      error: null,
    });

    const request = {
      json: () =>
        Promise.resolve({
          kind: "non-fiction",
          // Only kind is provided, all other fields are optional
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id: "project-456" });
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      kind: "non-fiction",
      title: null,
      description: null,
      plot: null,
    });
  });
});
