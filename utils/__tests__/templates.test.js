import { describe, expect, it } from "vitest";
import { templateTargetPath } from "../templates.js";

describe("templateTargetPath", () => {
  it("strips the underscore from a top-level dotfile", () => {
    expect(templateTargetPath("_.gitignore")).toBe(".gitignore");
  });

  it("strips the underscore from a directory segment", () => {
    expect(templateTargetPath("_.devcontainer/devcontainer.json")).toBe(
      ".devcontainer/devcontainer.json",
    );
  });

  it("strips the underscore from every segment, not just the first two", () => {
    expect(templateTargetPath("_.a/_.b/_.c")).toBe(".a/.b/.c");
  });

  it("leaves segments without a leading underscore unchanged", () => {
    expect(templateTargetPath("srv/cat_service.ts")).toBe("srv/cat_service.ts");
  });
});
