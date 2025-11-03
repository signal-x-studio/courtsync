#!/bin/bash

# Agent OS Setup Validation Script (Cost-Optimized)
# Quick validation - focus on essentials, minimize token usage

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Quick file existence check
validate_files() {
    local required_files=(".agent-os/config.yml" ".agent-os/fast-mode.yml" ".agent-os/careful-mode.yml")

    for file in "${required_files[@]}"; do
        [[ -f "$file" ]] || { log_error "Missing: $file"; return 1; }
        log_success "✓ Found: $file"
    done
}

# Basic YAML syntax check (if python available)
validate_yaml_syntax() {
    if command -v python3 &> /dev/null; then
        for file in .agent-os/*.yml; do
            [[ -f "$file" ]] && python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null && log_success "✓ YAML valid: $(basename "$file")" || log_error "✗ YAML invalid: $(basename "$file")"
        done
    else
        log_info "Python not available - skipping YAML validation"
    fi
}

# Check for placeholder values
check_placeholders() {
    if grep -q "PROJECT_NAME\|FRAMEWORK" .agent-os/config.yml; then
        log_info "Note: Config contains placeholders - customize as needed"
    else
        log_success "✓ Config appears customized"
    fi
}

# Main validation
main() {
    log_info "Agent OS Quick Validation"

    [[ -d ".agent-os" ]] || { log_error "Agent OS not initialized. Run init-project.sh first."; exit 1; }

    echo ""
    validate_files && echo "" && validate_yaml_syntax && echo "" && check_placeholders && echo ""

    log_success "Agent OS validation complete!"
    log_info "Ready to use fast/careful modes for development"
}

main "$@"