import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatPanel from "../chat/ChatPanel";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

afterEach(() => {
  // Clear all mocks after each test to prevent interference
  jest.clearAllMocks();
});

describe("ChatPanel", () => {
  it("renders chat interface elements", () => {
    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    expect(
      screen.getByPlaceholderText("Ask anything about your book…")
    ).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
    expect(screen.getByText("Generate chapter from notes")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Paste bullet points or notes…")
    ).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });

  it("sends chat message on Send button click", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ reply: "AI response" }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(
      <ChatPanel projectId="project-123" selectedChapterId="chapter-456" />
    );

    const input = screen.getByPlaceholderText("Ask anything about your book…");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Hello AI")).toBeInTheDocument();
    expect(screen.getByText("Thinking…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("AI response")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "project-123",
        messages: [{ role: "user", content: "Hello AI" }],
        selectedChapterId: "chapter-456",
      }),
    });
  });

  it("sends chat message on Enter key press", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ reply: "AI response" }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText("Ask anything about your book…");

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("AI response")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "project-123",
        messages: [{ role: "user", content: "Hello AI" }],
        selectedChapterId: null,
      }),
    });
  });

  it("does not send empty messages", () => {
    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText("Ask anything about your book…");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "   " } }); // Only whitespace
    fireEvent.click(sendButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });

  it("handles chat API errors gracefully", async () => {
    const mockResponse = {
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "API error" }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText("Ask anything about your book…");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText("Sorry, something went wrong.")
      ).toBeInTheDocument();
    });

    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });

  it("handles network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText("Ask anything about your book…");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText("Sorry, something went wrong.")
      ).toBeInTheDocument();
    });
  });

  it("clears input after sending message", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ reply: "AI response" }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText(
      "Ask anything about your book…"
    ) as HTMLInputElement;
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendButton);

    expect(input.value).toBe("");
  });

  it("generates chapter from notes", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const notesTextarea = screen.getByPlaceholderText(
      "Paste bullet points or notes…"
    );
    const generateButton = screen.getByText("Generate");

    fireEvent.change(notesTextarea, {
      target: { value: "Chapter notes here" },
    });
    fireEvent.click(generateButton);

    expect(screen.getByText("Generating…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Generate")).toBeInTheDocument(); // Button returns to normal
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/chapter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: "project-123",
        notes: "Chapter notes here",
      }),
    });

    // Check that notes are cleared and success message is added
    await waitFor(() => {
      expect(
        screen.getByText(
          "Draft chapter created from your notes in the structure panel under 'draft'."
        )
      ).toBeInTheDocument();
    });
    expect((notesTextarea as HTMLTextAreaElement).value).toBe("");
  });

  it("does not generate chapter with empty notes", () => {
    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const generateButton = screen.getByText("Generate");

    fireEvent.click(generateButton);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByText("Generating…")).not.toBeInTheDocument();
  });

  it("handles chapter generation errors gracefully", async () => {
    // Mock a failed response
    const mockResponse = {
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("Network error")),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockFetch.mockResolvedValueOnce(mockResponse as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const notesTextarea = screen.getByPlaceholderText(
      "Paste bullet points or notes…"
    );
    const generateButton = screen.getByText("Generate");

    fireEvent.change(notesTextarea, {
      target: { value: "Chapter notes here" },
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText("Generate")).toBeInTheDocument(); // Loading state ends
    });

    // Notes should not be cleared on error
    expect((notesTextarea as HTMLTextAreaElement).value).toBe(
      "Chapter notes here"
    );
  });

  it("disables generate button while loading", async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    };
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTimeout(() => resolve(mockResponse as any), 100);
        })
    );

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const notesTextarea = screen.getByPlaceholderText(
      "Paste bullet points or notes…"
    );
    const generateButton = screen.getByText("Generate");

    fireEvent.change(notesTextarea, {
      target: { value: "Chapter notes here" },
    });
    fireEvent.click(generateButton);

    const generatingButton = screen.getByText("Generating…");
    expect(generatingButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Generate")).toBeInTheDocument();
    });
  });

  it("displays multiple messages in conversation", async () => {
    const mockResponses = [
      {
        ok: true,
        json: jest.fn().mockResolvedValue({ reply: "First response" }),
      },
      {
        ok: true,
        json: jest.fn().mockResolvedValue({ reply: "Second response" }),
      },
    ];
    mockFetch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(mockResponses[0] as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValueOnce(mockResponses[1] as any);

    render(<ChatPanel projectId="project-123" selectedChapterId={null} />);

    const input = screen.getByPlaceholderText("Ask anything about your book…");
    const sendButton = screen.getByText("Send");

    // Send first message
    fireEvent.change(input, { target: { value: "First message" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("First response")).toBeInTheDocument();
    });

    // Send second message
    fireEvent.change(input, { target: { value: "Second message" } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Second response")).toBeInTheDocument();
    });

    // All messages should be visible
    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("First response")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getByText("Second response")).toBeInTheDocument();
  });
});
