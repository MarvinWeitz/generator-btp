import { globSync } from "glob";
import { join } from "node:path";

/**
 * Maps a template-relative path to its destination path by stripping the
 * leading underscore from each segment.
 *
 * @param {string} fileName - template-relative path using `/` separators
 * @returns {string}
 */
export function templateTargetPath(fileName) {
  return fileName
    .split("/")
    .map((segment) => segment.replace(/^_/, ""))
    .join("/");
}

/**
 * Copies a template tree into the generator's destination, applying EJS
 * templating with `data`. The leading underscore is stripped from every path
 * segment (`_.gitignore` -> `.gitignore`, `_.devcontainer/` -> `.devcontainer/`),
 * so dotfiles can live in the package without being ignored by npm or tooling.
 *
 * Consolidates the glob + rename + copy loop that several generators repeat.
 *
 * @param {object} gen - Yeoman generator (provides `fs.copyTpl`, `destinationPath`)
 * @param {string} root - absolute path to the template root directory
 * @param {object} data - EJS template data
 * @param {object} [options]
 * @param {(fileName: string) => boolean} [options.skip] - return true to skip a (relative) file
 */
export function copyTemplateTree(gen, root, data, { skip } = {}) {
  globSync("**", { cwd: root, nodir: true, posix: true }).forEach(
    (fileName) => {
      if (skip && skip(fileName)) {
        return;
      }

      const source = join(root, fileName);
      const target = gen.destinationPath(templateTargetPath(fileName));

      gen.fs.copyTpl(source, target, data);
    },
  );
}
