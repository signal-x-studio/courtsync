#!/bin/bash

# Agent OS Template Customization Script
# This script helps customize Agent OS templates for specific projects

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Interactive input with default
prompt_input() {
    local prompt=$1
    local default=$2
    local response

    read -p "$prompt [$default]: " response
    echo "${response:-$default}"
}

# Validate that we're in a project with Agent OS
check_agent_os_setup() {
    if [[ ! -d ".agent-os" ]]; then
        log_error "Agent OS not initialized. Run init-project.sh first."
        exit 1
    fi
}

# Customize main configuration
customize_config() {
    log_info "Customizing main configuration..."

    local config_file=".agent-os/config.yml"

    if [[ ! -f "$config_file" ]]; then
        log_error "Config file not found: $config_file"
        return 1
    fi

    # Get project information
    local project_name=$(prompt_input "Project name" "My Project")
    local project_version=$(prompt_input "Project version" "1.0.0")
    local project_description=$(prompt_input "Project description" "Project description")

    # Update config file
    sed -i '' "s/name: \".*\"/name: \"$project_name\"/g" "$config_file"
    sed -i '' "s/version: \".*\"/version: \"$project_version\"/g" "$config_file"
    sed -i '' "s/description: \".*\"/description: \"$project_description\"/g" "$config_file"

    log_success "Main configuration customized"
}

# Customize technology stack
customize_tech_stack() {
    log_info "Customizing technology stack..."

    local config_file=".agent-os/config.yml"

    echo "Select your technology stack:"

    # Frontend
    echo "Frontend frameworks:"
    echo "1. React"
    echo "2. Vue.js"
    echo "3. Angular"
    echo "4. Svelte"
    echo "5. Other"

    local frontend_choice=$(prompt_input "Frontend choice (1-5)" "1")
    case $frontend_choice in
        1) sed -i '' 's/- "FRAMEWORK"/- "React"/g' "$config_file" ;;
        2) sed -i '' 's/- "FRAMEWORK"/- "Vue.js"/g' "$config_file" ;;
        3) sed -i '' 's/- "FRAMEWORK"/- "Angular"/g' "$config_file" ;;
        4) sed -i '' 's/- "FRAMEWORK"/- "Svelte"/g' "$config_file" ;;
        5) local custom=$(prompt_input "Custom frontend framework" "React")
           sed -i '' "s/- \"FRAMEWORK\"/- \"$custom\"/g" "$config_file" ;;
    esac

    # Backend
    echo "Backend frameworks:"
    echo "1. Node.js/Express"
    echo "2. Python/FastAPI"
    echo "3. Java/Spring Boot"
    echo "4. Go/Gin"
    echo "5. Other"

    local backend_choice=$(prompt_input "Backend choice (1-5)" "1")
    case $backend_choice in
        1) sed -i '' 's/- "FRAMEWORK"/- "Node.js\/Express"/g' "$config_file" ;;
        2) sed -i '' 's/- "FRAMEWORK"/- "Python\/FastAPI"/g' "$config_file" ;;
        3) sed -i '' 's/- "FRAMEWORK"/- "Java\/Spring Boot"/g' "$config_file" ;;
        4) sed -i '' 's/- "FRAMEWORK"/- "Go\/Gin"/g' "$config_file" ;;
        5) local custom=$(prompt_input "Custom backend framework" "Node.js")
           sed -i '' "s/- \"FRAMEWORK\"/- \"$custom\"/g" "$config_file" ;;
    esac

    # Database
    echo "Database:"
    echo "1. PostgreSQL"
    echo "2. MySQL"
    echo "3. MongoDB"
    echo "4. SQLite"
    echo "5. Other"

    local db_choice=$(prompt_input "Database choice (1-5)" "1")
    case $db_choice in
        1) sed -i '' 's/DATABASE/PostgreSQL/g' "$config_file" ;;
        2) sed -i '' 's/DATABASE/MySQL/g' "$config_file" ;;
        3) sed -i '' 's/DATABASE/MongoDB/g' "$config_file" ;;
        4) sed -i '' 's/DATABASE/SQLite/g' "$config_file" ;;
        5) local custom=$(prompt_input "Custom database" "PostgreSQL")
           sed -i '' "s/DATABASE/$custom/g" "$config_file" ;;
    esac

    log_success "Technology stack customized"
}

# Customize workflow modes
customize_workflow() {
    log_info "Customizing workflow modes..."

    local workflow_file=".agent-os/workflow/config.yml"

    if [[ ! -f "$workflow_file" ]]; then
        log_warning "Workflow config not found, skipping customization"
        return 0
    fi

    echo "Workflow mode customization:"
    local enable_direct=$(prompt_input "Enable Direct mode (low risk)" "true")
    local enable_selective=$(prompt_input "Enable Selective mode (medium risk)" "true")
    local enable_thorough=$(prompt_input "Enable Thorough mode (high risk)" "true")

    # Update workflow config
    sed -i '' "s/enabled: true/enabled: $enable_direct/g" "$workflow_file"
    sed -i '' "s/enabled: true/enabled: $enable_selective/g" "$workflow_file"
    sed -i '' "s/enabled: true/enabled: $enable_thorough/g" "$workflow_file"

    log_success "Workflow modes customized"
}

# Customize quality standards
customize_standards() {
    log_info "Setting up quality standards..."

    # Create standards directories if they don't exist
    mkdir -p .agent-os/standards/{global,backend,frontend,testing}

    # Create basic standards files
    cat > .agent-os/standards/global/coding-style.md << 'EOF'
# Coding Style Standards

## General Principles
- Use consistent indentation (2 spaces)
- Use meaningful variable and function names
- Write self-documenting code
- Follow language-specific conventions

## Code Organization
- Group related functionality
- Use clear file and folder structure
- Separate concerns appropriately
- Keep files focused and single-purpose

## Comments and Documentation
- Comment complex logic
- Document public APIs
- Keep comments up-to-date
- Use clear, concise language
EOF

    cat > .agent-os/standards/global/error-handling.md << 'EOF'
# Error Handling Standards

## General Principles
- Handle errors gracefully
- Provide meaningful error messages
- Log errors appropriately
- Fail fast when necessary

## Error Types
- Validation errors: User input issues
- System errors: Infrastructure problems
- Business logic errors: Domain rule violations
- Security errors: Authentication/authorization issues

## Error Response Format
- Include error code
- Provide descriptive message
- Include debugging information (development only)
- Suggest corrective action when possible
EOF

    log_success "Basic quality standards created"
}

# Create project summary
create_summary() {
    log_info "Creating project summary..."

    local summary_file=".agent-os/PROJECT-SUMMARY.md"

    cat > "$summary_file" << EOF
# Project Summary

Generated on: $(date)
Project: $(grep 'name:' .agent-os/config.yml | cut -d'"' -f2)
Version: $(grep 'version:' .agent-os/config.yml | cut -d'"' -f2)

## Technology Stack
$(grep -A 10 'tech_stack:' .agent-os/config.yml | grep -E '(frontend|backend|database|testing)' | sed 's/^- /- /')

## Workflow Modes
- Direct: $(grep 'direct:' .agent-os/workflow/config.yml -A 1 | grep 'enabled:' | cut -d' ' -f2)
- Selective: $(grep 'selective:' .agent-os/workflow/config.yml -A 1 | grep 'enabled:' | cut -d' ' -f2)
- Thorough: $(grep 'thorough:' .agent-os/workflow/config.yml -A 1 | grep 'enabled:' | cut -d' ' -f2)

## Next Steps
1. Review all configuration files in .agent-os/
2. Customize role definitions for your team
3. Set up CI/CD with quality gates
4. Train team on workflow modes
5. Start using Agent OS for development tasks

## Resources
- Risk Assessment: .agent-os/workflow/risk-assessment.md
- Configuration Guide: .agent-os/README.md
- Template Documentation: .agent-os-templates/README.md
EOF

    log_success "Project summary created: $summary_file"
}

# Main function
main() {
    log_info "Agent OS Template Customization"
    log_info "================================"

    check_agent_os_setup

    echo ""
    log_info "This script will help you customize the Agent OS templates for your project."
    echo ""

    customize_config
    echo ""
    customize_tech_stack
    echo ""
    customize_workflow
    echo ""
    customize_standards
    echo ""
    create_summary

    echo ""
    log_success "Template customization complete!"
    log_info ""
    log_info "Review the generated files:"
    log_info "- .agent-os/config.yml (main configuration)"
    log_info "- .agent-os/workflow/config.yml (workflow settings)"
    log_info "- .agent-os/standards/ (quality standards)"
    log_info "- .agent-os/PROJECT-SUMMARY.md (project overview)"
    log_info ""
    log_info "Next: Commit these files to start using Agent OS!"
}

# Run main function
main "$@"