import { render, screen } from "@testing-library/react";
import AppHome from "../page";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock the Supabase server client
jest.mock("../../../lib/supabase/server", () => ({
  createSupabaseServerClient: jest.fn(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockLink({ children, href, className }: any) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

const mockCreateSupabaseServerClient =
  createSupabaseServerClient as jest.MockedFunction<
    typeof createSupabaseServerClient
  >;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  order: jest.fn(() => mockSupabaseClient),
};

describe("AppHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseServerClient.mockResolvedValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabaseClient as any
    );
  });

  it("redirects to login when user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    // Since this is a server component, we test the redirect behavior
    try {
      await AppHome();
    } catch {
      // The redirect will throw, which is expected behavior
    }

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders projects list when user has projects", async () => {
    const mockUser = { id: "user-123" };
    const mockProjects = [
      {
        id: "project-1",
        title: "First Novel",
        description: "A great story about adventure",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
      {
        id: "project-2",
        title: "Second Novel",
        description: "Another fantastic tale",
        created_at: "2024-01-03T00:00:00.000Z",
        updated_at: "2024-01-04T00:00:00.000Z",
      },
    ];

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: mockProjects,
      error: null,
    });

    const component = await AppHome();
    render(component);

    // Check for header
    expect(screen.getByText("Your Projects")).toBeInTheDocument();
    expect(
      screen.getByText("Continue writing or start something new.")
    ).toBeInTheDocument();

    // Check for project cards
    expect(screen.getByText("First Novel")).toBeInTheDocument();
    expect(
      screen.getByText("A great story about adventure")
    ).toBeInTheDocument();
    expect(screen.getByText("Second Novel")).toBeInTheDocument();
    expect(screen.getByText("Another fantastic tale")).toBeInTheDocument();

    // Check for updated dates
    expect(screen.getByText("Updated Jan 2, 2024")).toBeInTheDocument();
    expect(screen.getByText("Updated Jan 4, 2024")).toBeInTheDocument();

    // Check for Fiction labels
    expect(screen.getAllByText("Fiction")).toHaveLength(2);

    // Check for New Project button
    expect(screen.getByText("New Project")).toBeInTheDocument();
  });

  it("renders empty state when user has no projects", async () => {
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

    const component = await AppHome();
    render(component);

    // Check for header
    expect(screen.getByText("Your Projects")).toBeInTheDocument();
    expect(
      screen.getByText("Create a new project to start writing.")
    ).toBeInTheDocument();

    // Check for empty state
    expect(screen.getByText("No projects yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Start your writing journey by creating your first project."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Create Your First Project")).toBeInTheDocument();

    // Should still have the header New Project button
    expect(screen.getByText("New Project")).toBeInTheDocument();
  });

  it("handles projects with missing titles gracefully", async () => {
    const mockUser = { id: "user-123" };
    const mockProjects = [
      {
        id: "project-1",
        title: null,
        description: "A story without a title",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
    ];

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: mockProjects,
      error: null,
    });

    const component = await AppHome();
    render(component);

    // Should show fallback title
    expect(screen.getByText("Untitled Project")).toBeInTheDocument();
    expect(screen.getByText("A story without a title")).toBeInTheDocument();
  });

  it("handles projects with missing descriptions", async () => {
    const mockUser = { id: "user-123" };
    const mockProjects = [
      {
        id: "project-1",
        title: "My Novel",
        description: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
    ];

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: mockProjects,
      error: null,
    });

    const component = await AppHome();
    render(component);

    // Should show title but no description
    expect(screen.getByText("My Novel")).toBeInTheDocument();
    // Description should not be rendered when null
    expect(screen.queryByText("null")).not.toBeInTheDocument();
  });

  it("correctly formats different date formats", async () => {
    const mockUser = { id: "user-123" };
    const mockProjects = [
      {
        id: "project-1",
        title: "Test Project",
        description: "Test description",
        created_at: "2024-12-25T15:30:00.000Z",
        updated_at: "2024-12-25T15:30:00.000Z",
      },
    ];

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockResolvedValue({
      data: mockProjects,
      error: null,
    });

    const component = await AppHome();
    render(component);

    // Should format date correctly
    expect(screen.getByText("Updated Dec 25, 2024")).toBeInTheDocument();
  });

  it("verifies Supabase query parameters", async () => {
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

    await AppHome();

    // Verify the correct Supabase query was made
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("projects");
    expect(mockSupabaseClient.select).toHaveBeenCalledWith(
      "id, title, description, created_at, updated_at"
    );
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(mockSupabaseClient.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
  });
});
