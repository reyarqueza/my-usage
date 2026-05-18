import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges tailwind conflicts with tailwind-merge", () => {
    expect(cn("p-2 p-3", "p-4")).toBe("p-4");
  });
});
