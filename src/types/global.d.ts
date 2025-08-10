import "@testing-library/jest-dom";

declare global {
  namespace NodeJS {
    interface Global {
      NextRequest: new (...args: unknown[]) => unknown;
      NextResponse: {
        json: (
          data: unknown,
          options?: { status?: number }
        ) => {
          json: () => Promise<unknown>;
          status: number;
          headers: Map<string, string>;
          ok: boolean;
        };
        next: () => undefined;
      };
    }
  }

  var NextRequest: new (...args: unknown[]) => unknown;
  var NextResponse: {
    json: (
      data: unknown,
      options?: { status?: number }
    ) => {
      json: () => Promise<unknown>;
      status: number;
      headers: Map<string, string>;
      ok: boolean;
    };
    next: () => undefined;
  };
}

export {};
