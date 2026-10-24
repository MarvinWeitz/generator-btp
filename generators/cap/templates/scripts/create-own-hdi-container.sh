#!/bin/bash

set -euo pipefail

profile="ownHDI"
service_instance="<%= projectNameNormalized %>-db-service"
cf_org=""
cf_space=""

usage() {
    cat <<'EOF'
Create a personal HDI container and set CAP bindings.

Usage:
    scripts/create-own-hdi-container.sh [service-instance] [--org <org>] [--space <space>]

Options:
    --org <org>                        CF org to target (default: current cf target)
    --space <space>                    CF space to target (default: current cf target)
  -h, --help                         Show this help

Examples:
  scripts/create-own-hdi-container.sh
  scripts/create-own-hdi-container.sh <%= projectNameNormalized %>-db-service --org my-org --space dev
EOF
}

if [[ $# -gt 0 && "$1" != -* ]]; then
    service_instance="$1"
    shift
fi

while [[ $# -gt 0 ]]; do
    case "$1" in
        --org)
            if [[ $# -lt 2 ]]; then
                echo "Missing value for --org" >&2
                exit 1
            fi
            cf_org="$2"
            shift 2
            ;;
        --space)
            if [[ $# -lt 2 ]]; then
                echo "Missing value for --space" >&2
                exit 1
            fi
            cf_space="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if ! command -v cf >/dev/null 2>&1; then
    echo "Error: cf CLI is required but not found in PATH." >&2
    exit 1
fi

if ! command -v cds >/dev/null 2>&1; then
    echo "Warning: cds CLI not found in PATH. CAP bindings cannot be executed." >&2
fi

echo "Using configuration:"
echo "  HDI instance:      $service_instance"
echo "  CAP profile:       $profile"
echo "  CF org:            ${cf_org:-<current target>}"
echo "  CF space:          ${cf_space:-<current target>}"

target_args=()
[[ -n "$cf_org" ]] && target_args+=(-o "$cf_org")
[[ -n "$cf_space" ]] && target_args+=(-s "$cf_space")

echo
if [[ ${#target_args[@]} -gt 0 ]]; then
    echo "Targeting CF org/space..."
    cf target "${target_args[@]}"
else
    echo "Using current CF target:"
    if ! cf target; then
        echo "Error: no CF target set. Run 'cf login' or pass --org/--space." >&2
        exit 1
    fi
fi

echo
echo "Checking existing HDI instance..."
if cf service "$service_instance" >/dev/null 2>&1; then
    echo "Service instance already exists: $service_instance"
else
    echo "Creating service instance: $service_instance"
    cf create-service hana hdi-shared "$service_instance"
    echo "  cf service $service_instance"
fi

if command -v cds >/dev/null 2>&1; then
    echo
    echo "Waiting for the HDI container to be available..."
    sleep 5

    echo
    echo "  cds bind db --to $service_instance --for $profile"

    echo
    echo "Executing CAP bindings..."
    cds bind db --to "$service_instance" --for "$profile"
fi

echo
echo "Next steps:"
echo "  npm run deploy-ownHDI for deploying the db artifacts to your personal HDI container"
echo "  npm run ownHDI for running the CAP service with your personal HDI container"
