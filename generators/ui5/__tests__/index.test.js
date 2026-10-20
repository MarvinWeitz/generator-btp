import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "yeoman-assert";
import * as helpers from "yeoman-test";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("generator-btp:ui5", () => {
  describe("with existing UI5 apps", () => {
    let runResult;

    beforeAll(async () => {
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: true,
        })
        .inTmpDir((dir) => {
          // Create mock UI5 app structure
          const appDir = join(dir, "app", "myui5app");
          fs.mkdirSync(appDir, { recursive: true });

          // Create a minimal ui5.yaml to mark it as a UI5 app
          fs.writeFileSync(
            join(appDir, "ui5.yaml"),
            `specVersion: "3.0"
            metadata:
            name: myui5app
            type: application
            `,
          );

          // Create initial package.json
          fs.writeFileSync(
            join(appDir, "package.json"),
            JSON.stringify(
              {
                name: "myui5app",
                version: "1.0.0",
                scripts: {},
              },
              null,
              2,
            ),
          );

          // Create initial tsconfig.json
          fs.writeFileSync(
            join(appDir, "tsconfig.json"),
            JSON.stringify(
              {
                compilerOptions: {
                  target: "es2020",
                },
              },
              null,
              2,
            ),
          );
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("should detect UI5 apps", () => {
      expect(runResult.generator._detectedUi5Apps).toBeDefined();
      expect(runResult.generator._detectedUi5Apps.length).toBeGreaterThan(0);
    });

    it("should create eslint.config.mjs in UI5 app", () => {
      assert.file(["app/myui5app/eslint.config.mjs"]);
    });

    it("should create ui5lint.config.mjs in UI5 app", () => {
      assert.file(["app/myui5app/ui5lint.config.mjs"]);
    });

    it("should merge package.json with additions", () => {
      assert.file(["app/myui5app/package.json"]);
      const pkgPath = join(runResult.cwd, "app", "myui5app", "package.json");
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

      // Original fields should be preserved
      expect(pkgContent.name).toBe("myui5app");
      expect(pkgContent.version).toBe("1.0.0");

      // New scripts should be merged
      expect(pkgContent.scripts).toBeDefined();
      expect(pkgContent.scripts.lint).toBe("eslint .");
      expect(pkgContent.scripts["lint-fix"]).toBe("eslint . --fix");
      expect(pkgContent.scripts.ui5lint).toBe("ui5lint");

      // CDS configuration should be added
      expect(pkgContent.cds).toBeDefined();
      expect(pkgContent.cds.typer).toBeDefined();

      // Note: devDependencies are added by install() running `npm install
      // --save-dev` (covered separately in "installing UI5 dev dependencies"),
      // not by the additions merge — so they are intentionally not asserted here.
    });

    it("should update tsconfig.json with rootDirs", () => {
      assert.file(["app/myui5app/tsconfig.json"]);
      const tsPath = join(runResult.cwd, "app", "myui5app", "tsconfig.json");
      const tsContent = JSON.parse(fs.readFileSync(tsPath, "utf-8"));

      expect(tsContent.compilerOptions).toBeDefined();

      // Original compilerOptions should be preserved
      expect(tsContent.compilerOptions.target).toBe("es2020");

      // rootDirs should be added/merged
      expect(tsContent.compilerOptions.rootDirs).toBeDefined();
      expect(Array.isArray(tsContent.compilerOptions.rootDirs)).toBe(true);
      expect(tsContent.compilerOptions.rootDirs).toContain("./webapp");
      expect(tsContent.compilerOptions.rootDirs).toContain("../../@cds-models");
    });
  });

  describe("with multiple UI5 apps", () => {
    let runResult;

    beforeAll(async () => {
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: true,
        })
        .inTmpDir((dir) => {
          // Create two mock UI5 apps
          const app1Dir = join(dir, "app", "app1");
          const app2Dir = join(dir, "app", "app2");

          fs.mkdirSync(app1Dir, { recursive: true });
          fs.mkdirSync(app2Dir, { recursive: true });

          // Create ui5.yaml for both apps
          fs.writeFileSync(
            join(app1Dir, "ui5.yaml"),
            `specVersion: "3.0"
            metadata:
            name: app1
            type: application
            `,
          );
          fs.writeFileSync(
            join(app2Dir, "ui5.yaml"),
            `specVersion: "3.0"
            metadata:
            name: app2
            type: application
            `,
          );

          // Create package.json for both apps
          fs.writeFileSync(
            join(app1Dir, "package.json"),
            JSON.stringify({ name: "app1" }, null, 2),
          );
          fs.writeFileSync(
            join(app2Dir, "package.json"),
            JSON.stringify({ name: "app2" }, null, 2),
          );

          // Create tsconfig.json for both apps
          fs.writeFileSync(
            join(app1Dir, "tsconfig.json"),
            JSON.stringify({ compilerOptions: {} }, null, 2),
          );
          fs.writeFileSync(
            join(app2Dir, "tsconfig.json"),
            JSON.stringify({ compilerOptions: {} }, null, 2),
          );
        })
        .withSpawnMock((_method, command) => {
          if (command === "npm") {
            return;
          }
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("should detect multiple UI5 apps", () => {
      expect(runResult.generator._detectedUi5Apps.length).toBe(2);
    });

    it("should create config files for app1", () => {
      assert.file([
        "app/app1/eslint.config.mjs",
        "app/app1/ui5lint.config.mjs",
      ]);
    });

    it("should create config files for app2", () => {
      assert.file([
        "app/app2/eslint.config.mjs",
        "app/app2/ui5lint.config.mjs",
      ]);
    });
  });

  describe("installing UI5 dev dependencies", () => {
    let runResult;
    const npmCalls = [];

    beforeAll(async () => {
      // yeoman-test defaults skipInstall to true, so opt in explicitly to let
      // install() run; the npm spawn is mocked so no real install happens.
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: false,
        })
        .inTmpDir((dir) => {
          const appDir = join(dir, "app", "myui5app");
          fs.mkdirSync(appDir, { recursive: true });
          fs.writeFileSync(
            join(appDir, "ui5.yaml"),
            `specVersion: "3.0"\nmetadata:\n  name: myui5app\ntype: application\n`,
          );
          fs.writeFileSync(
            join(appDir, "package.json"),
            JSON.stringify({ name: "myui5app" }, null, 2),
          );
          fs.writeFileSync(
            join(appDir, "tsconfig.json"),
            JSON.stringify({ compilerOptions: {} }, null, 2),
          );
        })
        // withSpawnMock's callback receives (methodName, command, args, options).
        .withSpawnMock((_method, command, args) => {
          if (command === "npm") {
            npmCalls.push(args);
          }
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("runs npm install --save-dev with the configured dev dependencies", () => {
      const installCall = npmCalls.find((args) => args?.[0] === "install");
      expect(installCall).toBeDefined();
      expect(installCall).toContain("--save-dev");
      expect(installCall).toContain("--save-exact");
      expect(installCall).toContain("eslint@10");
      expect(installCall).toContain("typescript-eslint");
      expect(installCall).toContain("@ui5/linter");
    });
  });

  describe("without UI5 apps", () => {
    let runResult;

    beforeAll(async () => {
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: true,
        })
        .inTmpDir((dir) => {
          // Create app directory but no UI5 apps
          fs.mkdirSync(join(dir, "app"), { recursive: true });
        })
        .withSpawnMock((_method, command) => {
          if (command === "npm") {
            return;
          }
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("should detect no UI5 apps", () => {
      expect(runResult.generator._detectedUi5Apps.length).toBe(0);
    });
  });

  describe("with pre-existing rootDirs in tsconfig", () => {
    let runResult;

    beforeAll(async () => {
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: true,
        })
        .inTmpDir((dir) => {
          const appDir = join(dir, "app", "myui5app");
          fs.mkdirSync(appDir, { recursive: true });
          fs.writeFileSync(
            join(appDir, "ui5.yaml"),
            `specVersion: "3.0"\nmetadata:\n  name: myui5app\ntype: application\n`,
          );
          fs.writeFileSync(
            join(appDir, "package.json"),
            JSON.stringify({ name: "myui5app" }, null, 2),
          );
          // tsconfig already lists ./webapp — the addition also lists it, so the
          // union must not produce a duplicate entry.
          fs.writeFileSync(
            join(appDir, "tsconfig.json"),
            JSON.stringify(
              { compilerOptions: { rootDirs: ["./webapp"] } },
              null,
              2,
            ),
          );
        })
        .withSpawnMock((_method, command) => {
          if (command === "npm") {
            return;
          }
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("should union rootDirs without duplicating existing entries", () => {
      const tsPath = join(runResult.cwd, "app", "myui5app", "tsconfig.json");
      const tsContent = JSON.parse(fs.readFileSync(tsPath, "utf-8"));

      expect(tsContent.compilerOptions.rootDirs).toEqual([
        "./webapp",
        "../../@cds-models",
      ]);
    });
  });

  describe("with tsconfig missing compilerOptions", () => {
    let runResult;

    beforeAll(async () => {
      runResult = await helpers
        .run(join(__dirname, "../index.js"))
        .withOptions({
          skipInstall: true,
        })
        .inTmpDir((dir) => {
          const appDir = join(dir, "app", "myui5app");
          fs.mkdirSync(appDir, { recursive: true });
          fs.writeFileSync(
            join(appDir, "ui5.yaml"),
            `specVersion: "3.0"\nmetadata:\n  name: myui5app\ntype: application\n`,
          );
          fs.writeFileSync(
            join(appDir, "package.json"),
            JSON.stringify({ name: "myui5app" }, null, 2),
          );
          // No compilerOptions key at all — the generator must create it.
          fs.writeFileSync(join(appDir, "tsconfig.json"), JSON.stringify({}));
        })
        .withSpawnMock((_method, command) => {
          if (command === "npm") {
            return;
          }
        });
    });

    afterAll(() => {
      if (runResult) {
        runResult.restore();
      }
    });

    it("should create compilerOptions and populate rootDirs", () => {
      const tsPath = join(runResult.cwd, "app", "myui5app", "tsconfig.json");
      const tsContent = JSON.parse(fs.readFileSync(tsPath, "utf-8"));

      expect(tsContent.compilerOptions).toBeDefined();
      expect(tsContent.compilerOptions.rootDirs).toContain("./webapp");
      expect(tsContent.compilerOptions.rootDirs).toContain("../../@cds-models");
    });
  });
});
