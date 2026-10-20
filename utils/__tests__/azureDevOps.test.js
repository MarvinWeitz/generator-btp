import { describe, expect, it } from "vitest";
import {
  applyBestPracticeDefaults,
  detailedAzureDevOpsPrompts,
  parseAzureRepoUrl,
} from "../azureDevOps.js";

describe("parseAzureRepoUrl", () => {
  it("parses organization URL, project, and repo", () => {
    expect(
      parseAzureRepoUrl("https://dev.azure.com/myorg/myproject/_git/my-repo"),
    ).toEqual({
      azureDevOpsOrgUrl: "https://dev.azure.com/myorg",
      azureProjectName: "myproject",
      repoName: "my-repo",
    });
  });

  it("tolerates a trailing slash and surrounding whitespace", () => {
    expect(
      parseAzureRepoUrl(
        "  https://dev.azure.com/org123/proj456/_git/repo789/  ",
      ),
    ).toEqual({
      azureDevOpsOrgUrl: "https://dev.azure.com/org123",
      azureProjectName: "proj456",
      repoName: "repo789",
    });
  });

  it("returns null for a non-Azure URL", () => {
    expect(parseAzureRepoUrl("https://github.com/org/repo")).toBeNull();
  });

  it("returns null for a malformed Azure URL", () => {
    expect(parseAzureRepoUrl("https://dev.azure.com/org/_git/repo")).toBeNull();
  });
});

describe("applyBestPracticeDefaults", () => {
  it("sets the recommended defaults and derives pipelineName from the normalized project", () => {
    const answers = { projectNameNormalized: "my-project" };

    applyBestPracticeDefaults(answers);

    expect(answers.mainBranch).toBe("main");
    expect(answers.devBranch).toBe("development");
    expect(answers.setDevBranchAsDefault).toBe(true);
    expect(answers.minReviewers).toBe(1);
    expect(answers.mainAllowRebase).toBe(false);
    expect(answers.pipelineName).toBe("my-project");
    expect(answers.pipelineYamlPath).toBe("azure-pipelines.yml");
  });
});

describe("detailedAzureDevOpsPrompts", () => {
  it("uses the provided default pipeline name and asks for all policy settings", () => {
    const prompts = detailedAzureDevOpsPrompts("my-project");
    const byName = Object.fromEntries(prompts.map((p) => [p.name, p]));

    expect(byName.pipelineName.default).toBe("my-project");
    expect(byName.pipelineYamlPath.default).toBe("azure-pipelines.yml");
    // Spot-check that the full policy set is present.
    expect(prompts).toHaveLength(15);
    expect(byName.mainBranch).toBeDefined();
    expect(byName.devAllowNoFastForward).toBeDefined();
  });
});
