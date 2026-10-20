import { describe, expect, it } from "vitest";
import { spawnCommandSyncOrThrow } from "../spawn.js";

describe("spawnCommandSyncOrThrow", () => {
  it("returns the spawn result when the command succeeds", () => {
    const result = { exitCode: 0 };
    const generator = {
      spawnCommandSync: () => result,
    };

    expect(
      spawnCommandSyncOrThrow(generator, "cds", ["init"], undefined, "msg"),
    ).toBe(result);
  });

  it("forwards command, args, and options to spawnCommandSync", () => {
    const calls = [];
    const generator = {
      spawnCommandSync: (command, args, options) => {
        calls.push({ command, args, options });
      },
    };

    spawnCommandSyncOrThrow(
      generator,
      "cds",
      ["init", "--add", "typescript"],
      { cwd: "/tmp/x" },
      "msg",
    );

    expect(calls).toEqual([
      {
        command: "cds",
        args: ["init", "--add", "typescript"],
        options: { cwd: "/tmp/x" },
      },
    ]);
  });

  it("rethrows with the friendly message when the command fails", () => {
    const generator = {
      spawnCommandSync: () => {
        throw new Error("cds: command not found");
      },
    };

    expect(() =>
      spawnCommandSyncOrThrow(
        generator,
        "cds",
        ["init"],
        undefined,
        "`cds init` failed. Ensure @sap/cds-dk is installed globally.",
      ),
    ).toThrow(/@sap\/cds-dk/);
  });

  it("includes the underlying execa shortMessage detail", () => {
    const generator = {
      spawnCommandSync: () => {
        const error = new Error("long execa message");
        error.shortMessage = "Command failed with exit code 1";
        throw error;
      },
    };

    expect(() =>
      spawnCommandSyncOrThrow(generator, "cds", [], undefined, "friendly"),
    ).toThrow(/Command failed with exit code 1/);
  });
});
