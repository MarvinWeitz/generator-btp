import { describe, expect, it } from "vitest";
import { normalizeName } from "../naming.js";

describe("normalizeName", () => {
  it("lowercases the value", () => {
    expect(normalizeName("MyProject")).toBe("myproject");
  });

  it("replaces spaces with hyphens", () => {
    expect(normalizeName("My Project")).toBe("my-project");
  });

  it("collapses runs of whitespace into a single hyphen", () => {
    expect(normalizeName("Multi   Space  Name")).toBe("multi-space-name");
  });

  it("lowercases and hyphenates uppercase names with spaces", () => {
    expect(normalizeName("UPPER CASE NAME")).toBe("upper-case-name");
  });
});
