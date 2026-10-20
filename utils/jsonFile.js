import fs from "node:fs";
import { parse } from "comment-json";
import union from "lodash.union";

// Read JSON (with comments) from generator source path
function readJsonC(filePath, defaults) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return parse(raw);
  } catch {
    return defaults;
  }
}

// Read JSON (with comments) from destination path using mem-fs or fs
function readJsonCSafe(gen, destPath, defaults) {
  try {
    if (gen.fs.exists(destPath)) {
      const raw = gen.fs.read(destPath);
      return parse(raw);
    } else if (fs.existsSync(destPath)) {
      const raw = fs.readFileSync(destPath, "utf8");
      return parse(raw);
    }
  } catch {
    /* ignore and fall back */
  }
  return defaults;
}

function mergeArray(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return union(objValue, srcValue); // merge without duplicates
  }
}

const PKG_KEY_ORDER = [
  "name",
  "version",
  "description",
  "main",
  "module",
  "scripts",
  "keywords",
  "author",
  "license",
  "dependencies",
  "devDependencies",
];

function sortPackageJson(pkg) {
  const sorted = {};
  for (const key of PKG_KEY_ORDER) {
    if (Object.prototype.hasOwnProperty.call(pkg, key)) {
      sorted[key] = pkg[key];
    }
  }
  for (const key of Object.keys(pkg)) {
    if (!PKG_KEY_ORDER.includes(key)) {
      sorted[key] = pkg[key];
    }
  }
  return sorted;
}

export { readJsonC, readJsonCSafe, mergeArray, sortPackageJson };
