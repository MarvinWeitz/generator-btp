import fs from "node:fs";
import { resolve } from "node:path";

// Organisation-specific defaults live in presets, so the generator's own
// defaults work for anyone without a login. A preset is chosen with
// `--preset <name|file.json>` or the BTP_GENERATOR_PRESET environment variable.

export const PRESET_ENV_VAR = "BTP_GENERATOR_PRESET";

const DEFAULT_PRESET = {
  // Public image that cbs's private base image mirrors.
  baseImage: "mcr.microsoft.com/devcontainers/base:debian",
  pipelineRepository: "Central-Pipelines/central-cap-pipeline",
};

export const PRESETS = {
  default: DEFAULT_PRESET,
  cbs: {
    ...DEFAULT_PRESET,
    // Same image, pulled through cbs's Docker Hub organisation so pulls count
    // against the company's Docker licences. Requires `docker login`.
    baseImage: "cbsgroupdocker/cbs-debian:latest",
  },
};

const PRESET_KEYS = Object.keys(DEFAULT_PRESET);

/**
 * Resolves a preset by name, or loads it from a JSON file whose keys override
 * the default preset. Throws on unknown names, unreadable files and unknown keys,
 * so a typo never silently falls back to the defaults.
 *
 * @param {string} [nameOrPath] - preset name or path to a JSON file; empty means "default"
 * @param {string} [cwd] - base directory for relative file paths
 * @returns {typeof DEFAULT_PRESET & { name: string }}
 */
export function resolvePreset(nameOrPath, cwd = process.cwd()) {
  const value = nameOrPath?.trim() || "default";

  if (Object.hasOwn(PRESETS, value)) {
    return { name: value, ...PRESETS[value] };
  }

  if (!value.endsWith(".json")) {
    throw new Error(
      `Unknown preset "${value}". Use one of: ${Object.keys(PRESETS).join(", ")}, or a path to a .json file.`,
    );
  }

  const file = resolve(cwd, value);
  let custom;
  try {
    custom = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read preset file ${file}: ${error.message}`, {
      cause: error,
    });
  }

  const unknownKeys = Object.keys(custom).filter(
    (key) => !PRESET_KEYS.includes(key),
  );
  if (unknownKeys.length > 0) {
    throw new Error(
      `Unknown key(s) in preset file ${file}: ${unknownKeys.join(", ")}. Allowed: ${PRESET_KEYS.join(", ")}.`,
    );
  }

  return { name: file, ...DEFAULT_PRESET, ...custom };
}

/**
 * Registers the `--preset` option on a generator. Call from its constructor.
 *
 * @param {object} gen - Yeoman generator
 */
export function registerPresetOption(gen) {
  gen.option("preset", {
    type: String,
    description: `Organisation preset: ${Object.keys(PRESETS).join(", ")}, or a path to a .json file (env: ${PRESET_ENV_VAR})`,
  });
}

/**
 * The preset for a generator run: the `--preset` option, then the environment
 * variable, then "default".
 *
 * @param {object} gen - Yeoman generator
 */
export function presetFor(gen) {
  return resolvePreset(
    gen.options.preset ?? process.env[PRESET_ENV_VAR],
    gen.destinationRoot(),
  );
}
