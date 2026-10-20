/**
 * Normalizes a display name into a slug: lowercased, with runs of whitespace
 * collapsed to a single hyphen. Used for project/customer names in templates,
 * container names, MTA IDs, package names, etc.
 *
 * @param {string} value
 * @returns {string}
 */
export function normalizeName(value) {
  return value.toLowerCase().replace(/\s+/g, "-");
}
