import { GET, POST } from "../projects/route";
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
  eq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
  single: jest.fn(),
};

const mockCreateSupabaseRouteHandlerClient =
  createSupabaseRouteHandlerClient as jest.MockedFunction<
    typeof createSupabaseRouteHandlerClient
  >;

describe("/api/projects GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseRouteHandlerClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );
  });

  it("returns user's projects successfully", async () => {
    const mockUser = { id: "user-123" };
    const mockProjects = [
      {
        id: "project-1",
        title: "First Novel",
        description: "A great story",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
      {
        id: "project-2",
        title: "Second Novel",
        description: "Another story",
        created_at: "2024-01-03T00:00:00.000Z",
        updated_at: "2024-01-04T00:00:00.000Z",
      },
    ];

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    // Mock the query chain for GET request
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: mockProjects,
      error: null,
    });

    const request = new global.NextRequest(
      "http://localhost:3000/api/projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ projects: mockProjects });
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("projects");
    expect(mockSupabaseClient.select).toHaveBeenCalledWith(
      "id, title, description, created_at, updated_at"
    );
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockSupabaseClient.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
  });

  it("returns empty array when user has no projects", async () => {
    const mockUser = { id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const request = new global.NextRequest(
      "http://localhost:3000/api/projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ projects: [] });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const request = new global.NextRequest(
      "http://localhost:3000/api/projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("handles database errors gracefully", async () => {
    const mockUser = { id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    const request = new global.NextRequest(
      "http://localhost:3000/api/projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Database connection failed" });
  });

  it("handles null data response", async () => {
    const mockUser = { id: "user-123" };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new global.NextRequest(
      "http://localhost:3000/api/projects"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ projects: [] });
  });
});

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
      // Story Foundation
      premise: null,
      genre_tone: null,
      theme: null,
      // Worldbuilding Layer
      settings: null,
      world_rules: null,
      culture_history: null,
      sensory_details: null,
      // Characters
      protagonist: null,
      antagonist: null,
      supporting_cast: null,
      character_relationships: null,
      // Plot Structure
      outline_beats: null,
      conflict: null,
      pacing_resolution: null,
      subplots: null,
      // Writing Flow & Style
      point_of_view: null,
      voice_tone: null,
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
          kind: "non-fiction", // Invalid - only fiction is allowed
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
          kind: "fiction",
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
      kind: "fiction",
      title: null,
      description: null,
      plot: null,
      // Story Foundation
      premise: null,
      genre_tone: null,
      theme: null,
      // Worldbuilding Layer
      settings: null,
      world_rules: null,
      culture_history: null,
      sensory_details: null,
      // Characters
      protagonist: null,
      antagonist: null,
      supporting_cast: null,
      character_relationships: null,
      // Plot Structure
      outline_beats: null,
      conflict: null,
      pacing_resolution: null,
      subplots: null,
      // Writing Flow & Style
      point_of_view: null,
      voice_tone: null,
    });
  });

  describe("Book Wizard Fields", () => {
    it("creates a project with full book wizard data", async () => {
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
            title: "Epic Fantasy Novel",
            description: "A comprehensive fantasy story",
            plot: "A hero's journey through magical lands",
            // Story Foundation
            premise:
              "A young wizard discovers their true heritage and must save the world",
            genre_tone: "Epic Fantasy with dark undertones",
            theme: "The power of friendship and self-discovery",
            // Worldbuilding Layer
            settings: "Medieval fantasy world with floating cities",
            world_rules:
              "Magic requires emotional control and drains physical energy",
            culture_history:
              "Ancient civilization fell due to magical catastrophe",
            sensory_details:
              "Crisp mountain air, glowing crystals, echoing caverns",
            // Characters
            protagonist:
              "Alex: 17-year-old orphan with hidden magical abilities",
            antagonist:
              "Dark Lord Malachar: seeks to restore the old magical order",
            supporting_cast:
              "Mentor wizard Eldara, loyal friend Marcus, mysterious Sage",
            character_relationships:
              "Alex struggles to trust after betrayal, mentors guide reluctantly",
            // Plot Structure
            outline_beats:
              "Discovery, Training, First Trial, Betrayal, Final Confrontation",
            conflict:
              "Internal: self-doubt, External: magical threats to homeland",
            pacing_resolution:
              "Slow build through training, accelerating action, satisfying resolution",
            subplots: "Romance with fellow student, mystery of parents' death",
            // Writing Flow & Style
            point_of_view: "Third-person limited, Alex's perspective",
            voice_tone:
              "Lyrical but accessible, building tension through intimate moments",
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
        title: "Epic Fantasy Novel",
        description: "A comprehensive fantasy story",
        plot: "A hero's journey through magical lands",
        // Story Foundation
        premise:
          "A young wizard discovers their true heritage and must save the world",
        genre_tone: "Epic Fantasy with dark undertones",
        theme: "The power of friendship and self-discovery",
        // Worldbuilding Layer
        settings: "Medieval fantasy world with floating cities",
        world_rules:
          "Magic requires emotional control and drains physical energy",
        culture_history: "Ancient civilization fell due to magical catastrophe",
        sensory_details:
          "Crisp mountain air, glowing crystals, echoing caverns",
        // Characters
        protagonist: "Alex: 17-year-old orphan with hidden magical abilities",
        antagonist:
          "Dark Lord Malachar: seeks to restore the old magical order",
        supporting_cast:
          "Mentor wizard Eldara, loyal friend Marcus, mysterious Sage",
        character_relationships:
          "Alex struggles to trust after betrayal, mentors guide reluctantly",
        // Plot Structure
        outline_beats:
          "Discovery, Training, First Trial, Betrayal, Final Confrontation",
        conflict: "Internal: self-doubt, External: magical threats to homeland",
        pacing_resolution:
          "Slow build through training, accelerating action, satisfying resolution",
        subplots: "Romance with fellow student, mystery of parents' death",
        // Writing Flow & Style
        point_of_view: "Third-person limited, Alex's perspective",
        voice_tone:
          "Lyrical but accessible, building tension through intimate moments",
      });
    });

    it("handles partial book wizard data correctly", async () => {
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
            title: "Mystery Novel",
            // Only include some wizard fields
            premise: "A detective investigates a series of impossible crimes",
            genre_tone: "Cozy Mystery",
            protagonist:
              "Detective Sarah Chen: methodical, intuitive, haunted by past case",
            point_of_view: "First person",
            // Other fields will be null
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
        title: "Mystery Novel",
        description: null,
        plot: null,
        // Filled fields
        premise: "A detective investigates a series of impossible crimes",
        genre_tone: "Cozy Mystery",
        protagonist:
          "Detective Sarah Chen: methodical, intuitive, haunted by past case",
        point_of_view: "First person",
        // Null fields
        theme: null,
        settings: null,
        world_rules: null,
        culture_history: null,
        sensory_details: null,
        antagonist: null,
        supporting_cast: null,
        character_relationships: null,
        outline_beats: null,
        conflict: null,
        pacing_resolution: null,
        subplots: null,
        voice_tone: null,
      });
    });

    it("validates that extra fields are ignored", async () => {
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
            premise: "A simple story",
            // Invalid field that should be ignored by Zod
            invalid_field: "This should not appear in the database call",
            another_invalid: 12345,
          }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ id: "project-456" });

      // Verify that only valid schema fields are passed to database
      const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
      expect(insertCall).not.toHaveProperty("invalid_field");
      expect(insertCall).not.toHaveProperty("another_invalid");
      expect(insertCall.premise).toBe("A simple story");
    });
  });
});
