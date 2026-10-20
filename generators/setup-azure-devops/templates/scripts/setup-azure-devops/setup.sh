#!/bin/bash

###############################################################################
# Azure DevOps Setup Script
# 
# This script configures branch policies and creates a pipeline for your
# Azure DevOps repository.
#
# Prerequisites:
# - Azure CLI installed and authenticated (run 'az login --allow-no-subscriptions')
# - Azure DevOps extension installed (az extension add --name azure-devops)
# - Appropriate permissions in Azure DevOps project
# - Repository already created with main branch
#
# Usage:
#   1. Configure azure-devops.env with your values
#   2. Run: bash setup.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/azure-devops.env"

###############################################################################
# Functions
###############################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        echo "  Visit: https://docs.microsoft.com/cli/azure/install-azure-cli"
        exit 1
    fi
    log_success "Azure CLI found"
    
    # Check if Azure DevOps extension is installed
    if ! az extension list --output tsv | grep -q "azure-devops"; then
        log_warning "Azure DevOps extension not found. Installing..."
        az extension add --name azure-devops
        log_success "Azure DevOps extension installed"
    else
        log_success "Azure DevOps extension found"
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login --allow-no-subscriptions' first."
        exit 1
    fi
    log_success "Authenticated to Azure"
}

load_config() {
    log_info "Loading configuration from ${ENV_FILE}..."
    
    if [ ! -f "${ENV_FILE}" ]; then
        log_error "Configuration file not found: ${ENV_FILE}"
        log_error "Please create azure-devops.env from the template and configure it."
        exit 1
    fi
    
    # Source the env file
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    
    # Validate required variables
    if [ -z "${AZURE_DEVOPS_ORG_URL}" ]; then
        log_error "AZURE_DEVOPS_ORG_URL is not set in ${ENV_FILE}"
        exit 1
    fi
    
    if [ -z "${AZURE_PROJECT_NAME}" ]; then
        log_error "AZURE_PROJECT_NAME is not set in ${ENV_FILE}"
        exit 1
    fi
    
    if [ -z "${REPO_NAME}" ]; then
        log_error "REPO_NAME is not set in ${ENV_FILE}"
        exit 1
    fi
    
    log_success "Configuration loaded successfully"
    log_info "  Organization: ${AZURE_DEVOPS_ORG_URL}"
    log_info "  Project: ${AZURE_PROJECT_NAME}"
    log_info "  Repository: ${REPO_NAME}"
}

configure_azure_devops_defaults() {
    log_info "Configuring Azure DevOps CLI defaults..."
    az devops configure --defaults organization="${AZURE_DEVOPS_ORG_URL}" project="${AZURE_PROJECT_NAME}"
    log_success "Defaults configured"
}

get_repo_id() {
    log_info "Getting repository ID..."
    REPO_ID=$(az repos show --repository "${REPO_NAME}" --query id --output tsv)
    if [ -z "${REPO_ID}" ]; then
        log_error "Failed to get repository ID. Does the repository '${REPO_NAME}' exist?"
        exit 1
    fi
    log_success "Repository ID: ${REPO_ID}"
}

check_main_branch_exists() {
    log_info "Checking if '${MAIN_BRANCH}' branch exists..."
    
    if ! az repos ref list --repository "${REPO_NAME}" --query "[?name=='refs/heads/${MAIN_BRANCH}'].name" --output tsv | grep -q "refs/heads/${MAIN_BRANCH}"; then
        log_warning "The '${MAIN_BRANCH}' branch does not exist in the repository."
        log_info "This usually means the repository is empty with no initial commit."
        echo ""
        
        # Ask user if they want to create initial commit
        read -p "$(echo -e ${BLUE}?${NC}) Would you like to create an initial commit automatically? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_initial_commit
        else
            echo ""
            log_info "To manually create an initial commit:"
            echo "  1. Clone the repository: git clone ${AZURE_DEVOPS_ORG_URL}/${AZURE_PROJECT_NAME}/_git/${REPO_NAME}"
            echo "  2. Create an initial commit:"
            echo "       echo '# ${REPO_NAME}' > README.md"
            echo "       git add README.md"
            echo "       git commit -m 'Initial commit'"
            echo "       git push -u origin ${MAIN_BRANCH}"
            echo "  3. Run this setup script again"
            echo ""
            exit 1
        fi
    else
        log_success "'${MAIN_BRANCH}' branch exists"
    fi
}

create_initial_commit() {
    log_info "Creating initial commit..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Cannot create initial commit automatically."
        exit 1
    fi
    
    # Create a temporary directory
    TEMP_DIR=$(mktemp -d)
    log_info "Using temporary directory: ${TEMP_DIR}"
    
    # Clone the empty repository
    log_info "Cloning repository..."
    REPO_URL="${AZURE_DEVOPS_ORG_URL}/${AZURE_PROJECT_NAME}/_git/${REPO_NAME}"
    
    if ! git clone "${REPO_URL}" "${TEMP_DIR}/${REPO_NAME}" 2>/dev/null; then
        log_error "Failed to clone repository. Please check your credentials and permissions."
        rm -rf "${TEMP_DIR}"
        exit 1
    fi
    
    cd "${TEMP_DIR}/${REPO_NAME}"
    
    # Configure git user if not set
    if [ -z "$(git config user.email)" ]; then
        git config user.email "azure-devops-setup@example.com"
        git config user.name "Azure DevOps Setup Script"
    fi
    
    # Create README.md
    log_info "Creating README.md..."
    cat > README.md << EOF
# ${REPO_NAME}

This repository was initialized automatically by the Azure DevOps setup script.

## Getting Started

Add your project documentation here.
EOF
    
    # Commit and push
    log_info "Committing and pushing to '${MAIN_BRANCH}'..."
    git add README.md
    git commit -m "Initial commit"
    git push -u origin "${MAIN_BRANCH}"
    
    # Clean up
    cd - > /dev/null
    rm -rf "${TEMP_DIR}"
    
    log_success "Initial commit created and pushed to '${MAIN_BRANCH}'"
}

ensure_branch_exists() {
    local branch_name=$1
    log_info "Checking if branch '${branch_name}' exists..."
    
    if az repos ref list --repository "${REPO_NAME}" --query "[?name=='refs/heads/${branch_name}'].name" --output tsv | grep -q "refs/heads/${branch_name}"; then
        log_success "Branch '${branch_name}' exists"
    else
        log_warning "Branch '${branch_name}' does not exist"
        log_info "Creating branch '${branch_name}' from main..."
        
        # Get the commit SHA of the main branch
        MAIN_COMMIT=$(az repos ref list --repository "${REPO_NAME}" --query "[?name=='refs/heads/${MAIN_BRANCH}'].objectId" --output tsv)
        
        if [ -z "${MAIN_COMMIT}" ]; then
            log_error "Failed to get commit SHA for '${MAIN_BRANCH}' branch"
            exit 1
        fi
        
        az repos ref create --name "refs/heads/${branch_name}" --repository "${REPO_NAME}" --object-id "${MAIN_COMMIT}"
        log_success "Branch '${branch_name}' created"
    fi
}

set_default_branch() {
    if [ "${SET_DEVELOPMENT_BRANCH_AS_DEFAULT}" = true ]; then
        log_info "Setting '${DEV_BRANCH}' as the default branch..."
        az repos update --repository "${REPO_NAME}" --default-branch "${DEV_BRANCH}"
        log_success "'${DEV_BRANCH}' is now the default branch"
    else 
        log_info "Keeping '${MAIN_BRANCH}' as the default branch"
    fi
}

configure_main_branch_policies() {
    log_info "Configuring branch policies for '${MAIN_BRANCH}'..."
    
    # Minimum number of reviewers policy
    log_info "  Setting minimum approver count policy..."
    az repos policy approver-count create \
        --blocking true \
        --enabled true \
        --creator-vote-counts false \
        --allow-downvotes false \
        --reset-on-source-push "${MAIN_RESET_ON_SOURCE_PUSH}" \
        --branch "${MAIN_BRANCH}" \
        --minimum-approver-count "${MIN_REVIEWERS}" \
        --repository-id "${REPO_ID}" \
        --output none 2>/dev/null || log_warning "Approver count policy may already exist"
    
    # Build validation policy
    log_info "  Setting build validation policy..."
    
    # Check if build validation policy already exists for this branch and build definition
    EXISTING_BUILD_POLICY=$(az repos policy list --repository-id "${REPO_ID}" --branch "${MAIN_BRANCH}" \
        --query "[?type.displayName=='Build' && settings.buildDefinitionId==${BUILD_DEFINITION_ID}].id" \
        --output tsv 2>/dev/null)
    
    if [ -n "${EXISTING_BUILD_POLICY}" ]; then
        log_warning "Build validation policy already exists for '${MAIN_BRANCH}' (Policy ID: ${EXISTING_BUILD_POLICY})"
    else
        az repos policy build create \
            --blocking true \
            --enabled true \
            --manual-queue-only false \
            --queue-on-source-update-only true \
            --valid-duration 0 \
            --branch "${MAIN_BRANCH}" \
            --build-definition-id "${BUILD_DEFINITION_ID}" \
            --display-name "PR Build Validation - ${MAIN_BRANCH}" \
            --repository-id "${REPO_ID}" \
            --output none
        log_success "Build validation policy created"
    fi
    
    # Merge type restriction policy
    log_info "  Setting merge type restriction policy..."
    az repos policy merge-strategy create \
        --blocking true \
        --branch "${MAIN_BRANCH}" \
        --enabled true \
        --repository-id "${REPO_ID}" \
        --allow-no-fast-forward "${MAIN_ALLOW_NO_FAST_FORWARD}" \
        --allow-rebase "${MAIN_ALLOW_REBASE}" \
        --allow-rebase-merge "${MAIN_ALLOW_REBASE_MERGE}" \
        --allow-squash "${MAIN_ALLOW_SQUASH_MERGE}" \
        --output none 2>/dev/null || log_warning "Merge type policy may already exist"
    
    log_success "Main branch policies configured"
}

configure_dev_branch_policies() {
    log_info "Configuring branch policies for '${DEV_BRANCH}'..."
    
    # Build validation policy
    log_info "  Setting build validation policy..."
    
    # Check if build validation policy already exists for this branch and build definition
    EXISTING_BUILD_POLICY=$(az repos policy list --repository-id "${REPO_ID}" --branch "${DEV_BRANCH}" \
        --query "[?type.displayName=='Build' && settings.buildDefinitionId==${BUILD_DEFINITION_ID}].id" \
        --output tsv 2>/dev/null)
    
    if [ -n "${EXISTING_BUILD_POLICY}" ]; then
        log_warning "Build validation policy already exists for '${DEV_BRANCH}' (Policy ID: ${EXISTING_BUILD_POLICY})"
    else
        az repos policy build create \
            --blocking true \
            --enabled true \
            --manual-queue-only false \
            --queue-on-source-update-only true \
            --valid-duration 0 \
            --branch "${DEV_BRANCH}" \
            --build-definition-id "${BUILD_DEFINITION_ID}" \
            --display-name "PR Build Validation - ${DEV_BRANCH}" \
            --repository-id "${REPO_ID}" \
            --output none
        log_success "Build validation policy created"
    fi
    
    # Merge type restriction policy for development branch
    log_info "  Setting merge type restriction policy..."
    az repos policy merge-strategy create \
        --blocking true \
        --branch "${DEV_BRANCH}" \
        --enabled true \
        --repository-id "${REPO_ID}" \
        --allow-no-fast-forward "${DEV_ALLOW_NO_FAST_FORWARD}" \
        --allow-rebase "${DEV_ALLOW_REBASE}" \
        --allow-rebase-merge "${DEV_ALLOW_REBASE_MERGE}" \
        --allow-squash "${DEV_ALLOW_SQUASH_MERGE}" \
        --output none 2>/dev/null || log_warning "Merge type policy may already exist"
    
    log_success "Development branch policies configured"
}

create_or_get_pipeline() {
    log_info "Setting up pipeline '${PIPELINE_NAME}'..."
    
    # Check if pipeline already exists
    if az pipelines list --query "[?name=='${PIPELINE_NAME}'].id" --output tsv | grep -q .; then
        BUILD_DEFINITION_ID=$(az pipelines list --query "[?name=='${PIPELINE_NAME}'].id" --output tsv)
        log_warning "Pipeline '${PIPELINE_NAME}' already exists. Using existing pipeline."
        log_info "  Pipeline ID: ${BUILD_DEFINITION_ID}"
    else
        # Create pipeline (tfsgit = Azure Repos Git)
        log_info "Creating pipeline..."
        BUILD_DEFINITION_ID=$(az pipelines create \
            --name "${PIPELINE_NAME}" \
            --repository "${REPO_NAME}" \
            --repository-type tfsgit \
            --branch "${MAIN_BRANCH}" \
            --yml-path "${PIPELINE_YAML_PATH}" \
            --skip-first-run \
            --query id \
            --output tsv)
        
        log_success "Pipeline '${PIPELINE_NAME}' created"
        log_info "  Pipeline ID: ${BUILD_DEFINITION_ID}"
    fi
    
    if [ -z "${BUILD_DEFINITION_ID}" ]; then
        log_error "Failed to get pipeline ID"
        exit 1
    fi
}

###############################################################################
# Main execution
###############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          Azure DevOps Repository Setup Script                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    load_config
    configure_azure_devops_defaults
    get_repo_id
    check_main_branch_exists
    
    # Ensure development branch exists
    ensure_branch_exists "${DEV_BRANCH}"
    
    # Set default branch
    set_default_branch
    
    # Create or get pipeline (needed for build validation policies)
    create_or_get_pipeline
    
    # Configure branch policies (including build validation)
    configure_main_branch_policies
    configure_dev_branch_policies
    
    echo ""
    log_success "Azure DevOps setup completed successfully!"
    echo ""
    echo "Summary:"
    echo "  • Default branch: ${DEV_BRANCH}"
    echo "  • Main branch policies: Min ${MIN_REVIEWERS} reviewer(s), build validation, merge restrictions"
    echo "  • Development branch policies: Build validation, merge restrictions"
    echo "  • Pipeline: ${PIPELINE_NAME} (ID: ${BUILD_DEFINITION_ID})"
    echo ""
    echo "Links:"
    echo "  • Pipeline: ${AZURE_DEVOPS_ORG_URL}/${AZURE_PROJECT_NAME}/_build?definitionId=${BUILD_DEFINITION_ID}"
    echo "  • Main branch policies: ${AZURE_DEVOPS_ORG_URL}/${AZURE_PROJECT_NAME}/_settings/repositories?repo=${REPO_ID}&_a=policiesMid&refs=refs%2Fheads%2F${MAIN_BRANCH}"
    echo "  • Dev branch policies: ${AZURE_DEVOPS_ORG_URL}/${AZURE_PROJECT_NAME}/_settings/repositories?repo=${REPO_ID}&_a=policiesMid&refs=refs%2Fheads%2F${DEV_BRANCH}"
    echo ""
    log_info "Next steps:"
    echo "  1. Review the policies in Azure DevOps portal"
    echo "  2. Configure additional settings as needed"
    echo "  3. Start pushing your code and creating pull requests"
    echo ""
}

# Run main function
main "$@"
