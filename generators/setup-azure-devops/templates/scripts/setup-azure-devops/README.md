# Azure DevOps Setup Script

This directory contains a script to automate the configuration of your Azure DevOps repository with branch policies and CI/CD pipeline.

## What This Script Does

The `setup.sh` script configures the following in your Azure DevOps repository:

### Branch Configuration

- **Creates** the `development` branch if it doesn't exist
- **Optionally sets** `development` as the default branch (configurable)

### `Main` Branch Policies

- **Minimum reviewers**: Requires at least 1 approver (configurable)
- **Prohibits self-approval**: The person who created the PR cannot approve it
- **Reset approvals on push**: Optionally reset votes when new commits are pushed (configurable)
- **Build validation**: Automatically runs the pipeline to validate PRs
- **Merge type restrictions** (all configurable):
  - Squash merge (combines all commits into one)
  - Rebase with merge commit (semi-linear history)
  - Rebase and fast-forward (linear history, no merge commit)
  - Basic merge/no fast-forward (preserves all commits and history)

### Development Branch Policies

- **Build validation**: Automatically runs the pipeline to validate PRs
- **Merge type restrictions** (all configurable):
  - Squash merge (combines all commits into one)
  - Rebase with merge commit (semi-linear history)
  - Rebase and fast-forward (linear history, no merge commit)
  - Basic merge/no fast-forward (preserves all commits and history)

### Pipeline

- **Creates** an Azure Pipeline named after your project (configurable)
- **Uses** a YAML file from your repository (default: `azure-pipelines.yml`, configurable)
- **Connects** to the `main` and `development` branch
- **Skips** the first automatic run

## Prerequisites

Before running this script, ensure you have:

1. **Azure CLI** installed

   ```bash
   # Check if installed
   az --version
   
   # Install if needed (Linux/macOS)
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Azure DevOps extension** installed

   ```bash
   az extension add --name azure-devops
   ```

3. **Authenticated** to Azure

   ```bash
   az login --allow-no-subscriptions
   ```

4. **Appropriate permissions** in your Azure DevOps organization:
   - Project Administrator or higher
   - Or specific permissions for:
     - Managing repository policies
     - Creating pipelines
     - Managing branches

## Setup Instructions

### Step 1: Configure Environment Variables

1. Open the `azure-devops.env` file in this directory and review it.

### Step 2: Run the Setup Script

Execute the script from this directory:

```bash
bash setup.sh
```

Or make it executable and run directly:

```bash
chmod +x setup.sh
./setup.sh
```

### Step 3: Verify Configuration

After the script completes successfully:

1. Visit your Azure DevOps repository in your browser
2. Navigate to **Repos** → **Branches**
3. Verify:
   - If configured, `development` is marked as the default branch
   - Both `main` and `development` branches have policy icons
4. Navigate to **Pipelines** to see your new pipeline

## Configuration Options

All configuration is done through the `azure-devops.env` file:

### Required Settings

| Variable               | Description                        |
| ---------------------- | ---------------------------------- |
| `AZURE_DEVOPS_ORG_URL` | Your Azure DevOps organization URL |
| `AZURE_PROJECT_NAME`   | Project name in Azure DevOps       |

### Branch Settings

| Variable                            | Description                               | Default                  |
| ----------------------------------- | ----------------------------------------- | ------------------------ |
| `REPO_NAME`                         | Repository name                           | Generated project's name |
| `MAIN_BRANCH`                       | Name of production branch                 | `main`                   |
| `DEV_BRANCH`                        | Name of development branch                | `development`            |
| `SET_DEVELOPMENT_BRANCH_AS_DEFAULT` | Set dev branch as default in Azure DevOps | `true`                   |

### Main Branch Policy Settings

| Variable                     | Description                                      | Default |
| ---------------------------- | ------------------------------------------------ | ------- |
| `MIN_REVIEWERS`              | Minimum PR reviewers required                    | `1`     |
| `MAIN_RESET_ON_SOURCE_PUSH`  | Reset approvals when new commits are pushed      | `true`  |
| `MAIN_ALLOW_NO_FAST_FORWARD` | Allow basic merge (preserves all history)        | `false` |
| `MAIN_ALLOW_SQUASH_MERGE`    | Allow squash merge (all commits → 1 commit)      | `true`  |
| `MAIN_ALLOW_REBASE`          | Allow rebase and fast-forward (linear, no merge) | `false` |
| `MAIN_ALLOW_REBASE_MERGE`    | Allow rebase with merge commit (semi-linear)     | `true`  |

### Development Branch Policy Settings

| Variable                    | Description                                      | Default |
| --------------------------- | ------------------------------------------------ | ------- |
| `DEV_ALLOW_NO_FAST_FORWARD` | Allow basic merge (preserves all history)        | `false` |
| `DEV_ALLOW_SQUASH_MERGE`    | Allow squash merge (all commits → 1 commit)      | `true`  |
| `DEV_ALLOW_REBASE`          | Allow rebase and fast-forward (linear, no merge) | `false` |
| `DEV_ALLOW_REBASE_MERGE`    | Allow rebase with merge commit (semi-linear)     | `true`  |

### Pipeline Settings

| Variable             | Description                        | Default                  |
| -------------------- | ---------------------------------- | ------------------------ |
| `PIPELINE_NAME`      | Name of the pipeline to create     | Generated project's name |
| `PIPELINE_YAML_PATH` | Path to pipeline YAML file in repo | `azure-pipelines.yml`    |

## Additional Resources

- [Azure DevOps CLI documentation](https://docs.microsoft.com/en-us/cli/azure/devops)
- [Branch policies documentation](https://docs.microsoft.com/en-us/azure/devops/repos/git/branch-policies)
- [Azure Pipelines documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
