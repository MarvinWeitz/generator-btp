import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as helpers from "yeoman-test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("generator-btp:app", () => {
  // The router's only job is to compose the right sub-generator for the chosen
  // kind, so a single parameterized run over every choice covers it — no need
  // for one bespoke describe block per kind asserting the same thing.
  describe("prompting", () => {
    it.each(["cap", "ui5", "devcontainer", "setup-azure-devops"])(
      "should compose the '%s' generator for that choice",
      async (choice) => {
        const prompts = {
          kind: choice,
        };

        // Add CAP-specific prompts
        if (choice === "cap") {
          Object.assign(prompts, {
            projectName: "Test Project",
            customerName: "Test Customer",
            dbSchema: "TEST_SCHEMA",
            useAzureDevOps: true,
            azureRepoUrl:
              "https://dev.azure.com/testorg/testproject/_git/test-repo",
            useBestPractices: true,
            cdsFeatures: [
              "typescript",
              "mta",
              "xsuaa",
              "hana",
              "sqlite",
              "html5-repo",
              "tiny-sample",
              "http",
              "test",
            ],
          });
        }

        // Add setup-azure-devops-specific prompts
        if (choice === "setup-azure-devops") {
          Object.assign(prompts, {
            projectName: "Test Project",
            azureRepoUrl:
              "https://dev.azure.com/testorg/testproject/_git/test-repo",
            useBestPractices: true,
          });
        }

        const runResult = await helpers
          .run(join(__dirname, "../index.js"))
          .withPrompts(prompts)
          .withOptions({
            skipInstall: true,
          })
          .withSpawnMock(() => {});

        // Verify the choice was stored correctly
        expect(runResult.generator.kind).toBeDefined();
        expect(runResult.generator.kind).toBe(choice);

        runResult.restore();
      },
    );
  });
});
