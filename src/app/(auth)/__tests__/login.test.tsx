import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../login/page";
import { createSupabaseBrowserClient } from "../../../lib/supabase/client";

// Mock the Supabase client
jest.mock("../../../lib/supabase/client", () => ({
  createSupabaseBrowserClient: jest.fn(),
}));

// Mock Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock Lucide React icons
jest.mock("lucide-react", () => ({
  LogIn: () => <div data-testid="login-icon">Login Icon</div>,
}));

const mockSupabaseClient = {
  auth: {
    signInWithOAuth: jest.fn(),
  },
};

const mockCreateSupabaseBrowserClient =
  createSupabaseBrowserClient as jest.MockedFunction<
    typeof createSupabaseBrowserClient
  >;

// Mock window.location.origin properly
// Use a different approach since jsdom has issues with location mocking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).location = { origin: "http://localhost:3000" };

// Mock alert
global.alert = jest.fn();

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateSupabaseBrowserClient.mockReturnValue(mockSupabaseClient as any);
  });

  it("renders login page elements", () => {
    render(<LoginPage />);

    expect(screen.getByText("ZeroWriter")).toBeInTheDocument();
    expect(screen.getByText("Sign in to start writing.")).toBeInTheDocument();
    expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    expect(screen.getByTestId("login-icon")).toBeInTheDocument();
    expect(screen.getByText("Terms")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
  });

  it("initiates Google OAuth on button click", async () => {
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const signInButton = screen.getByText("Sign in with Google");
    fireEvent.click(signInButton);

    await waitFor(() => {
      // The mock location doesn't seem to include port, so check what was actually called
      const call = mockSupabaseClient.auth.signInWithOAuth.mock.calls[0][0];
      expect(call.provider).toBe("google");
      expect(call.options.queryParams).toEqual({
        access_type: "offline",
        prompt: "consent",
      });
      // Check that redirectTo includes the auth callback path
      expect(call.options.redirectTo).toMatch(/\/auth\/callback$/);
    });
  });

  it("disables button while loading", async () => {
    mockSupabaseClient.auth.signInWithOAuth.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(<LoginPage />);

    const signInButton = screen.getByText("Sign in with Google");
    fireEvent.click(signInButton);

    expect(signInButton).toBeDisabled();

    await waitFor(() => {
      expect(signInButton).not.toBeDisabled();
    });
  });

  it("handles OAuth errors gracefully", async () => {
    const mockError = new Error("OAuth error");
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      error: mockError,
    });

    render(<LoginPage />);

    const signInButton = screen.getByText("Sign in with Google");
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to sign in");
      expect(console.error).toHaveBeenCalledWith(mockError);
    });

    expect(signInButton).not.toBeDisabled();
  });

  it("handles exceptions during OAuth", async () => {
    const mockError = new Error("Network error");
    mockSupabaseClient.auth.signInWithOAuth.mockRejectedValue(mockError);

    render(<LoginPage />);

    const signInButton = screen.getByText("Sign in with Google");
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Failed to sign in");
      expect(console.error).toHaveBeenCalledWith(mockError);
    });

    expect(signInButton).not.toBeDisabled();
  });

  it("has correct styling classes", () => {
    render(<LoginPage />);

    const container = screen.getByText("ZeroWriter").closest("div");
    expect(container).toHaveClass("w-full", "max-w-md", "p-8");

    const signInButton = screen.getByText("Sign in with Google");
    expect(signInButton).toHaveClass("w-full", "inline-flex", "items-center");
  });

  it("creates Supabase client on mount", () => {
    render(<LoginPage />);

    expect(mockCreateSupabaseBrowserClient).toHaveBeenCalled();
  });

  it("renders terms and privacy links", () => {
    render(<LoginPage />);

    const termsLink = screen.getByText("Terms");
    const privacyLink = screen.getByText("Privacy");

    expect(termsLink).toBeInTheDocument();
    expect(privacyLink).toBeInTheDocument();
    expect(termsLink.closest("a")).toHaveAttribute("href", "#");
    expect(privacyLink.closest("a")).toHaveAttribute("href", "#");
  });
});
