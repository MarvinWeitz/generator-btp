/**
 * Runs a command via the generator's `spawnCommandSync` and, if it fails,
 * rethrows with an actionable message.
 *
 * `spawnCommandSync` delegates to execa's `execaSync`, which throws on a
 * non-zero exit (or a missing binary) rather than returning a status. This
 * wrapper turns that low-level throw into a clear, user-facing error while
 * preserving the underlying detail.
 *
 * @param {object} generator - Yeoman generator (provides `spawnCommandSync`)
 * @param {string} command
 * @param {string[]} args
 * @param {object|undefined} options - passed through to `spawnCommandSync`
 * @param {string} friendlyMessage - actionable message prepended to the error
 */
export function spawnCommandSyncOrThrow(
  generator,
  command,
  args,
  options,
  friendlyMessage,
) {
  try {
    return generator.spawnCommandSync(command, args, options);
  } catch (error) {
    const detail = error?.shortMessage ?? error?.message ?? String(error);
    throw new Error(`${friendlyMessage}\n${detail}`, { cause: error });
  }
}
