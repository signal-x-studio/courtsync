#!/bin/bash

# Agent OS Project Initialization Script (Cost-Optimized)
# One-command setup with sensible defaults - minimal configuration required

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validate project type
validate_project_type() {
    local project_type=$1
    local valid_types=("web-fullstack" "api-service" "mobile-app" "data-science")

    for type in "${valid_types[@]}"; do
        [[ "$type" == "$project_type" ]] && return 0
    done

    log_error "Invalid project type: $project_type"
    log_info "Valid types: ${valid_types[*]}"
    exit 1
}

# Create minimal .agent-os structure
create_agent_os_structure() {
    local project_type=$1
    local project_name=$2

    log_info "Creating minimal Agent OS structure..."

    mkdir -p .agent-os

    # Copy optimized templates
    cp .agent-os-templates/config.template.yml .agent-os/config.yml
    cp .agent-os-templates/workflow/fast-mode.yml .agent-os/
    cp .agent-os-templates/workflow/careful-mode.yml .agent-os/

    # Create simple README
    cat > .agent-os/README.md << EOF
# Agent OS (Cost-Optimized)

**Project:** $project_name
**Type:** $project_type
**Initialized:** $(date)

## Quick Start

- **95% of work:** Use fast mode (automated validations only)
- **5% of work:** Use careful mode (includes selective reviews)

## Commands

\`\`\`bash
# Fast mode (automated only)
agent-os validate --mode fast

# Careful mode (with reviews when needed)
agent-os validate --mode careful
\`\`\`

## Philosophy

Maximum quality value per token spent. No unnecessary delegation or redundant reviews.
EOF
}

# Customize configuration
customize_config() {
    local project_type=$1
    local project_name=$2

    log_info "Customizing config for $project_name..."

    # Simple sed replacements
    sed -i '' "s/PROJECT_NAME/$project_name/g" .agent-os/config.yml
    sed -i '' "s/web-fullstack/$project_type/g" .agent-os/config.yml

    # Set framework based on type
    case $project_type in
        "web-fullstack") sed -i '' 's/FRAMEWORK/React/g' .agent-os/config.yml ;;
        "api-service") sed -i '' 's/FRAMEWORK/Node.js/g' .agent-os/config.yml ;;
        "mobile-app") sed -i '' 's/FRAMEWORK/React Native/g' .agent-os/config.yml ;;
        "data-science") sed -i '' 's/FRAMEWORK/Python/g' .agent-os/config.yml ;;
    esac
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."

    local required_files=(".agent-os/config.yml" ".agent-os/fast-mode.yml" ".agent-os/careful-mode.yml")

    for file in "${required_files[@]}"; do
        [[ -f "$file" ]] || { log_error "Missing: $file"; exit 1; }
    done

    log_success "Setup validation passed!"
}

# Main function
main() {
    local project_type=""
    local project_name=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type) project_type="$2"; shift 2 ;;
            --name) project_name="$2"; shift 2 ;;
            --help)
                echo "Usage: $0 --type <type> --name <name>"
                echo ""
                echo "Types: web-fullstack, api-service, mobile-app, data-science"
                echo "Example: $0 --type web-fullstack --name my-app"
                exit 0 ;;
            *) log_error "Unknown option: $1"; exit 1 ;;
        esac
    done

    # Defaults
    [[ -z "$project_type" ]] && { log_error "Project type required"; exit 1; }
    [[ -z "$project_name" ]] && project_name=$(basename "$(pwd)")

    log_info "Initializing cost-optimized Agent OS for $project_name ($project_type)"

    validate_project_type "$project_type"
    create_agent_os_structure "$project_type" "$project_name"
    customize_config "$project_type" "$project_name"
    validate_setup

    log_success "Agent OS initialized!"
    log_info "Use fast mode for 95% of work, careful mode for 5% of high-risk changes"
}

main "$@"