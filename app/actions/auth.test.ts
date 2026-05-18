import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { loginWithGitHub, logout } from "./auth";
import { signIn, signOut } from "@/auth";

describe("auth server actions", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);
    vi.mocked(signOut).mockResolvedValue(undefined as never);
  });

  it("delegates GitHub login to NextAuth signIn", async () => {
    await loginWithGitHub();
    expect(signIn).toHaveBeenCalledWith("github", {
      redirectTo: "/dashboard",
    });
  });

  it("delegates logout to NextAuth signOut", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
