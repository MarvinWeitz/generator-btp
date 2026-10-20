// Shared Azure DevOps prompt + URL helpers, used by both the CAP generator and
// the standalone setup-azure-devops generator. Keeping these in one place avoids
// the two generators drifting apart on URL parsing, branch-policy prompts, or
// the recommended best-practice defaults.

export const AZURE_REPO_URL_REGEX =
  /^https:\/\/dev\.azure\.com\/([^/]+)\/([^/]+)\/_git\/([^/]+)\/?$/;

/**
 * Prompt for the Azure DevOps repository URL (validated against the expected
 * dev.azure.com/ORG/PROJECT/_git/REPO shape).
 */
export function azureRepoUrlPrompt() {
  return {
    type: "input",
    name: "azureRepoUrl",
    message:
      "Enter your Azure DevOps repository URL:\n  (Example: https://dev.azure.com/ORG_NAME/PROJECT_NAME/_git/REPO_NAME)\n  Your repository URL:",
    validate(input) {
      if (AZURE_REPO_URL_REGEX.test(input.trim())) {
        return true;
      }
      return "Invalid Azure DevOps repository URL. Expected format: https://dev.azure.com/ORG_NAME/PROJECT_NAME/_git/REPO_NAME";
    },
  };
}

/**
 * Prompt for whether to apply the recommended branch-policy/merge defaults.
 */
export function useBestPracticesPrompt() {
  return {
    type: "confirm",
    name: "useBestPractices",
    message:
      "Use recommended best practices for branch policies and merge strategies?\n  Choose no to customize settings in detail with best practices as defaults.",
    default: true,
  };
}

/**
 * Parses an Azure DevOps repository URL into its organization URL, project, and
 * repository names. Returns null if the URL does not match the expected shape.
 *
 * @param {string} url
 * @returns {{ azureDevOpsOrgUrl: string, azureProjectName: string, repoName: string } | null}
 */
export function parseAzureRepoUrl(url) {
  const match = url.trim().match(AZURE_REPO_URL_REGEX);
  if (!match) {
    return null;
  }

  return {
    azureDevOpsOrgUrl: `https://dev.azure.com/${match[1]}`,
    azureProjectName: match[2],
    repoName: match[3],
  };
}

/**
 * The detailed branch-policy and merge-strategy prompts shown when the user
 * declines the best-practice defaults.
 *
 * @param {string} defaultPipelineName - default for the Azure Pipeline name
 */
export function detailedAzureDevOpsPrompts(defaultPipelineName) {
  return [
    {
      type: "input",
      name: "mainBranch",
      message: "Enter the name of the main/production branch:",
      default: "main",
    },
    {
      type: "input",
      name: "devBranch",
      message: "Enter the name of the development branch:",
      default: "development",
    },
    {
      type: "confirm",
      name: "setDevBranchAsDefault",
      message: "Set development branch as the default branch?",
      default: true,
    },
    {
      type: "number",
      name: "minReviewers",
      message: "Minimum number of reviewers required for PRs to main:",
      default: 1,
      validate(input) {
        return input >= 0 ? true : "Must be 0 or greater";
      },
    },
    {
      type: "confirm",
      name: "mainResetOnSourcePush",
      message:
        "Reset approvals when new commits are pushed to PRs (main branch)?",
      default: true,
    },
    {
      type: "confirm",
      name: "mainAllowSquashMerge",
      message: "Allow squash merge on main branch?",
      default: true,
    },
    {
      type: "confirm",
      name: "mainAllowRebaseMerge",
      message: "Allow rebase with merge commit on main branch?",
      default: true,
    },
    {
      type: "confirm",
      name: "mainAllowRebase",
      message: "Allow rebase and fast-forward on main branch?",
      default: false,
    },
    {
      type: "confirm",
      name: "mainAllowNoFastForward",
      message: "Allow basic merge (no fast-forward) on main branch?",
      default: false,
    },
    {
      type: "confirm",
      name: "devAllowSquashMerge",
      message: "Allow squash merge on development branch?",
      default: true,
    },
    {
      type: "confirm",
      name: "devAllowRebaseMerge",
      message: "Allow rebase with merge commit on development branch?",
      default: true,
    },
    {
      type: "confirm",
      name: "devAllowRebase",
      message: "Allow rebase and fast-forward on development branch?",
      default: false,
    },
    {
      type: "confirm",
      name: "devAllowNoFastForward",
      message: "Allow basic merge (no fast-forward) on development branch?",
      default: false,
    },
    {
      type: "input",
      name: "pipelineName",
      message: "Enter the Azure Pipeline name:",
      default: defaultPipelineName,
    },
    {
      type: "input",
      name: "pipelineYamlPath",
      message: "Enter the path to the pipeline YAML file:",
      default: "azure-pipelines.yml",
    },
  ];
}

/**
 * Applies the recommended best-practice branch-policy/merge defaults onto the
 * answers object (used when the user does not customize in detail).
 *
 * @param {object} answers - must already have `projectNameNormalized` set
 */
export function applyBestPracticeDefaults(answers) {
  answers.mainBranch = "main";
  answers.devBranch = "development";
  answers.setDevBranchAsDefault = true;
  answers.minReviewers = 1;
  answers.mainResetOnSourcePush = true;
  answers.mainAllowSquashMerge = true;
  answers.mainAllowRebaseMerge = true;
  answers.mainAllowRebase = false;
  answers.mainAllowNoFastForward = false;
  answers.devAllowSquashMerge = true;
  answers.devAllowRebaseMerge = true;
  answers.devAllowRebase = false;
  answers.devAllowNoFastForward = false;
  answers.pipelineName = answers.projectNameNormalized;
  answers.pipelineYamlPath = "azure-pipelines.yml";
}
