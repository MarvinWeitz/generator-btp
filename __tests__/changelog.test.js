import { readFileSync } from "node:fs";

const root = (p) => new URL(`../${p}`, import.meta.url);
const changelog = readFileSync(root("CHANGELOG.md"), "utf8");
const { version } = JSON.parse(readFileSync(root("package.json"), "utf8"));

// The text under "## <heading> - <date>" up to the next "## ". The Release
// workflow cuts out the release notes the same way.
function section(heading) {
  const lines = changelog.split("\n");
  const start = lines.findIndex(
    (l) => l.split(" ")[0] === "##" && l.split(" ")[1] === heading,
  );
  if (start < 0) {
    return undefined;
  }
  const end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  return lines
    .slice(start + 1, end < 0 ? undefined : end)
    .join("\n")
    .trim();
}

describe("CHANGELOG.md", () => {
  it("has an entry for the version in package.json", () => {
    expect(
      changelog,
      `CHANGELOG.md has no entry for ${version}. Rename "Unreleased" to "${version} - YYYY-MM-DD", or add a section with that heading.`,
    ).toMatch(
      new RegExp(
        `^## ${version.replaceAll(".", "\\.")} - \\d{4}-\\d{2}-\\d{2}$`,
        "m",
      ),
    );
    expect(section(version), `The entry for ${version} is empty.`).toBeTruthy();
  });
});
