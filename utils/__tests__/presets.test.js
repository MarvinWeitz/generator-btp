import fs from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRESETS, resolvePreset } from "../presets.js";

describe("resolvePreset", () => {
  it("falls back to the default preset when nothing is given", () => {
    expect(resolvePreset(undefined)).toEqual({
      name: "default",
      ...PRESETS.default,
    });
    expect(resolvePreset("  ").name).toBe("default");
  });

  it("uses the public base image by default", () => {
    expect(resolvePreset("default").baseImage).toBe(
      "mcr.microsoft.com/devcontainers/base:debian",
    );
  });

  it("uses the cbs base image for the cbs preset", () => {
    expect(resolvePreset("cbs").baseImage).toBe(
      "cbsgroupdocker/cbs-debian:latest",
    );
  });

  it("has no shared pipeline repository by default", () => {
    expect(resolvePreset("default").pipelineRepository).toBe("");
  });

  it("uses the cbs shared pipeline repository for the cbs preset", () => {
    expect(resolvePreset("cbs").pipelineRepository).toBe(
      "Central-Pipelines/central-cap-pipeline",
    );
  });

  it("rejects an unknown preset name", () => {
    expect(() => resolvePreset("acme")).toThrow(/Unknown preset "acme"/);
  });

  describe("from a JSON file", () => {
    let dir;

    beforeEach(() => {
      dir = fs.mkdtempSync(join(os.tmpdir(), "preset-"));
    });

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    it("overrides the default preset with the file's keys", () => {
      fs.writeFileSync(
        join(dir, "acme.json"),
        JSON.stringify({ baseImage: "registry.acme.example/debian:1" }),
      );
      const preset = resolvePreset("acme.json", dir);
      expect(preset.baseImage).toBe("registry.acme.example/debian:1");
      expect(preset.pipelineRepository).toBe(
        PRESETS.default.pipelineRepository,
      );
    });

    it("rejects unknown keys", () => {
      fs.writeFileSync(
        join(dir, "typo.json"),
        JSON.stringify({ baseimage: "x" }),
      );
      expect(() => resolvePreset("typo.json", dir)).toThrow(
        /Unknown key\(s\).*baseimage/,
      );
    });

    it("rejects a missing file", () => {
      expect(() => resolvePreset("missing.json", dir)).toThrow(
        /Cannot read preset file/,
      );
    });
  });
});
