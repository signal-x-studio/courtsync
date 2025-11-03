#!/bin/bash

# Agent OS Token Optimization Script
# Analyze and optimize token usage patterns

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Analyze current usage patterns
analyze_usage() {
    log_info "Analyzing token usage patterns..."

    # Check workflow mode usage (if log files exist)
    if [[ -f ".agent-os/usage.log" ]]; then
        local fast_count=$(grep -c "fast-mode" .agent-os/usage.log)
        local careful_count=$(grep -c "careful-mode" .agent-os/usage.log)
        local total=$((fast_count + careful_count))

        if [[ $total -gt 0 ]]; then
            local fast_percent=$((fast_count * 100 / total))
            log_info "Usage: $fast_percent% fast mode, $((100-fast_percent))% careful mode"
            [[ $fast_percent -lt 80 ]] && log_warning "Consider using fast mode for more work"
        fi
    else
        log_info "No usage logs found - start logging to track patterns"
    fi
}

# Suggest optimizations
suggest_optimizations() {
    log_info "Optimization suggestions:"

    echo "1. Use fast mode for 95% of development work"
    echo "2. Batch related validations together"
    echo "3. Cache results when safe"
    echo "4. Focus manual reviews on high-risk areas only"
    echo "5. Monitor and eliminate redundant checks"
}

# Calculate theoretical savings
calculate_savings() {
    log_info "Theoretical token savings analysis:"

    echo "- Eliminating redundant reviews: ~30-50% reduction"
    echo "- Using fast mode appropriately: ~20-40% reduction"
    echo "- Batching operations: ~10-20% reduction"
    echo "- Smart caching: ~5-15% reduction"
    echo ""
    echo "Total potential: 65-95% token cost reduction"
}

# Main function
main() {
    log_info "Agent OS Token Optimization Analysis"

    echo ""
    analyze_usage
    echo ""
    suggest_optimizations
    echo ""
    calculate_savings
    echo ""
    log_success "Focus: Maximum quality value per token spent"
}

main "$@"