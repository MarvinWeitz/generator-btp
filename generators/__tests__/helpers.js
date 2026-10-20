import assert from "yeoman-assert";

/**
 * Validates that devcontainer.json is correctly templated with user inputs
 * @param {string} customerName - Original customer name
 * @param {string} projectName - Original project name
 * @param {string} expectedCustomerNormalized - Expected normalized customer name
 * @param {string} expectedProjectNormalized - Expected normalized project name
 */
export function assertDevcontainerTemplating(
  customerName,
  projectName,
  expectedCustomerNormalized,
  expectedProjectNormalized,
) {
  // Verify container name field uses original names
  const containerNameRegex = new RegExp(
    `"name":\\s*"${customerName.replace(/\s+/g, "\\s*")}\\s*-\\s*${projectName.replace(/\s+/g, "\\s*")}"`,
  );
  assert.fileContent(".devcontainer/devcontainer.json", containerNameRegex);

  // Verify docker container name uses normalized names
  const dockerNameRegex = new RegExp(
    `"--name=${expectedCustomerNormalized}\\.${expectedProjectNormalized}"`,
  );
  assert.fileContent(".devcontainer/devcontainer.json", dockerNameRegex);
}
