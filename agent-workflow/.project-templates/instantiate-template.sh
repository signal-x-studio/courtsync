#!/bin/bash

###############################################################################
# Project Template Instantiation Script
# Version: 1.0.0
# Purpose: Replace {PLACEHOLDER} markers with project-specific values
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Project Template Instantiation Script v1.0.0         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in a project directory
if [ ! -d ".agent-os" ] || [ ! -d ".claude" ]; then
    echo -e "${RED}ERROR: .agent-os or .claude directory not found${NC}"
    echo "Please run this script from your project root after copying templates."
    echo ""
    echo "To copy templates:"
    echo "  cp -r ~/Workspace/.project-templates/.agent-os ."
    echo "  cp -r ~/Workspace/.project-templates/.claude ."
    exit 1
fi

echo -e "${YELLOW}This script will replace {PLACEHOLDER} markers in your project files.${NC}"
echo -e "${YELLOW}Please provide the following information:${NC}"
echo ""

# Function to prompt for input with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local result

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " result
        echo "${result:-$default}"
    else
        read -p "$prompt: " result
        echo "$result"
    fi
}

# Project Identity
echo -e "${GREEN}=== Project Identity ===${NC}"
PROJECT_NAME=$(prompt_with_default "Project Name (e.g., AIQ, MatchFlow)")
PROJECT_DESCRIPTION=$(prompt_with_default "Project Description (one line)")
PROJECT_TYPE=$(prompt_with_default "Project Type" "web-app")
echo ""

# Business Context
echo -e "${GREEN}=== Business Context ===${NC}"
BUSINESS_MODEL=$(prompt_with_default "Business Model" "SaaS")
PRIMARY_USER=$(prompt_with_default "Primary User Type (singular)" "user")
PRIMARY_USER_PLURAL=$(prompt_with_default "Primary User Type (plural)" "users")
CORE_VALUE_PROPOSITION=$(prompt_with_default "Core Value Proposition")
TARGET_AUDIENCE=$(prompt_with_default "Target Audience" "$PRIMARY_USER_PLURAL")
echo ""

# Technical Stack
echo -e "${GREEN}=== Technical Stack ===${NC}"
FRAMEWORK=$(prompt_with_default "Framework" "Next.js")
LANGUAGE=$(prompt_with_default "Language" "TypeScript")
CSS_FRAMEWORK=$(prompt_with_default "CSS Framework" "Tailwind")
COMPONENT_LIBRARY=$(prompt_with_default "Component Library" "shadcn/ui")
DATABASE=$(prompt_with_default "Database" "PostgreSQL")
echo ""

# Design System
echo -e "${GREEN}=== Design System ===${NC}"
DESIGN_SYSTEM_SOURCE=$(prompt_with_default "Design System Source" "tailwind.config.ts")
COMPONENT_PATH=$(prompt_with_default "Component Path" "components/ui")
COMPONENT_IMPORT_PATH=$(prompt_with_default "Component Import Path" "@/components/ui")
PRIMARY_BRAND_COLOR=$(prompt_with_default "Primary Brand Color" "#5B7CFF")
THEME_MODE=$(prompt_with_default "Theme Mode (dark/light/system)" "dark")
FONT_FAMILY_PRIMARY=$(prompt_with_default "Primary Font" "Inter")
FONT_FAMILY_MONO=$(prompt_with_default "Monospace Font" "JetBrains Mono")
echo ""

# Roadmap
echo -e "${GREEN}=== Roadmap ===${NC}"
TOTAL_PHASES=$(prompt_with_default "Total Phases" "5")
CURRENT_PHASE=$(prompt_with_default "Current Phase" "Phase 1")
CURRENT_PHASE_WEEKS=$(prompt_with_default "Current Phase Duration (weeks)" "4")
echo ""

# Strategic Documents
echo -e "${GREEN}=== Strategic Documents ===${NC}"
STRATEGIC_DOC_PATH=$(prompt_with_default "Strategic Doc Path" "docs/strategy/README.md")
PRD_PATH=$(prompt_with_default "PRD Path" "docs/prd.md")
ROADMAP_DOC_PATH=$(prompt_with_default "Roadmap Path" "docs/roadmap.md")
echo ""

# Get creation date
CREATION_DATE=$(date +"%Y-%m-%d")

echo -e "${BLUE}───────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}Starting replacement...${NC}"
echo ""

# Function to replace placeholders in a file
replace_in_file() {
    local file="$1"

    # Skip if file doesn't exist
    [ ! -f "$file" ] && return

    echo "Processing: $file"

    # Use sed to replace all placeholders
    sed -i.bak \
        -e "s|{PROJECT_NAME}|$PROJECT_NAME|g" \
        -e "s|{PROJECT_DESCRIPTION}|$PROJECT_DESCRIPTION|g" \
        -e "s|{PROJECT_TYPE}|$PROJECT_TYPE|g" \
        -e "s|{BUSINESS_MODEL}|$BUSINESS_MODEL|g" \
        -e "s|{PRIMARY_USER}|$PRIMARY_USER|g" \
        -e "s|{PRIMARY_USER_PLURAL}|$PRIMARY_USER_PLURAL|g" \
        -e "s|{CORE_VALUE_PROPOSITION}|$CORE_VALUE_PROPOSITION|g" \
        -e "s|{TARGET_AUDIENCE}|$TARGET_AUDIENCE|g" \
        -e "s|{FRAMEWORK}|$FRAMEWORK|g" \
        -e "s|{LANGUAGE}|$LANGUAGE|g" \
        -e "s|{CSS_FRAMEWORK}|$CSS_FRAMEWORK|g" \
        -e "s|{COMPONENT_LIBRARY}|$COMPONENT_LIBRARY|g" \
        -e "s|{DATABASE}|$DATABASE|g" \
        -e "s|{DESIGN_SYSTEM_SOURCE}|$DESIGN_SYSTEM_SOURCE|g" \
        -e "s|{COMPONENT_PATH}|$COMPONENT_PATH|g" \
        -e "s|{COMPONENT_IMPORT_PATH}|$COMPONENT_IMPORT_PATH|g" \
        -e "s|{PRIMARY_BRAND_COLOR}|$PRIMARY_BRAND_COLOR|g" \
        -e "s|{THEME_MODE}|$THEME_MODE|g" \
        -e "s|{FONT_FAMILY_PRIMARY}|$FONT_FAMILY_PRIMARY|g" \
        -e "s|{FONT_FAMILY_MONO}|$FONT_FAMILY_MONO|g" \
        -e "s|{TOTAL_PHASES}|$TOTAL_PHASES|g" \
        -e "s|{CURRENT_PHASE}|$CURRENT_PHASE|g" \
        -e "s|{CURRENT_PHASE_WEEKS}|$CURRENT_PHASE_WEEKS|g" \
        -e "s|{STRATEGIC_DOC_PATH}|$STRATEGIC_DOC_PATH|g" \
        -e "s|{PRD_PATH}|$PRD_PATH|g" \
        -e "s|{ROADMAP_DOC_PATH}|$ROADMAP_DOC_PATH|g" \
        -e "s|{CREATION_DATE}|$CREATION_DATE|g" \
        "$file"

    # Remove backup file
    rm -f "${file}.bak"
}

# Find all template files and process them
find .agent-os .claude CLAUDE.md -type f 2>/dev/null | while read file; do
    replace_in_file "$file"
done

echo ""
echo -e "${GREEN}✅ Replacement complete!${NC}"
echo ""

# Check for remaining placeholders
echo -e "${YELLOW}Checking for remaining placeholders...${NC}"
remaining=$(grep -r "{[A-Z_]*}" .agent-os .claude CLAUDE.md 2>/dev/null | wc -l)

if [ "$remaining" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $remaining remaining placeholders${NC}"
    echo "These need to be replaced manually as they're project-specific:"
    grep -r "{[A-Z_]*}" .agent-os .claude CLAUDE.md 2>/dev/null | head -10
    echo ""
    echo "Search for { in your files and replace with appropriate values."
else
    echo -e "${GREEN}✅ No remaining placeholders found!${NC}"
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "1. Review generated files in .agent-os/ and .claude/"
echo "2. Replace any remaining {PLACEHOLDER} markers manually"
echo "3. Customize templates for your specific use case"
echo "4. Update CLAUDE.md with compliance framework"
echo "5. Test with: npm run type-check && npm test"
echo ""
echo -e "${GREEN}Happy building! 🚀${NC}"
