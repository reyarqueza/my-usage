import { NextRequest, NextResponse } from "next/server";
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
  type MockedFunction,
} from "vitest";

type AuthCallback = (req: {
  auth?: unknown;
  nextUrl: URL;
}) => ReturnType<typeof NextResponse.redirect> | undefined;

const authMock: MockedFunction<(cb: AuthCallback) => Promise<unknown>> =
  vi.fn();

vi.mock("@/auth", () => ({
  auth: (cb: AuthCallback) => authMock(cb),
}));

afterEach(() => {
  vi.resetModules();
  authMock.mockReset();
});

describe("proxy", () => {
  it("exports dashboard matcher config", async () => {
    authMock.mockImplementation(() =>
      Promise.resolve(async () => undefined),
    );
    const { config } = await import("./proxy");
    expect(config.matcher).toEqual(["/dashboard/:path*"]);
  });

  it("redirects unauthenticated requests under /dashboard", async () => {
    authMock.mockImplementation((callback) =>
      Promise.resolve(
        async (req: NextRequest) => callback(req as never),
      ),
    );
    const { default: proxy } = await import("./proxy");
    const req = new NextRequest(new URL("http://localhost/dashboard/team"));
    const res = await proxy(req, undefined);
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://localhost/login");
  });

  it("does not redirect when the session is present", async () => {
    authMock.mockImplementation((callback) =>
      Promise.resolve(
        async (req: NextRequest) => callback(req as never),
      ),
    );
    const { default: proxy } = await import("./proxy");
    const req = new NextRequest(new URL("http://localhost/dashboard"));
    (req as NextRequest & { auth: unknown }).auth = { user: { id: "1" } };
    const res = await proxy(req, undefined);
    expect(res).toBeUndefined();
  });

  it("does not redirect when the path is outside /dashboard", async () => {
    authMock.mockImplementation((callback) =>
      Promise.resolve(
        async (req: NextRequest) => callback(req as never),
      ),
    );
    const { default: proxy } = await import("./proxy");
    const req = new NextRequest(new URL("http://localhost/login"));
    const res = await proxy(req, undefined);
    expect(res).toBeUndefined();
  });

  it("throws when the auth middleware never resolves to a function", async () => {
    authMock.mockImplementation(() => Promise.resolve("not-a-function"));
    const { default: proxy } = await import("./proxy");
    const req = new NextRequest(new URL("http://localhost/dashboard"));
    await expect(proxy(req)).rejects.toThrow(TypeError);
  });
});
