# Universal Project Templates

**Version:** 1.0.0
**Created:** 2025-10-25
**Purpose:** Reusable project configuration templates for Agent-OS and Claude Code development

## Overview

This directory contains abstract, reusable templates for setting up new projects with Agent-OS workflow system and Claude Code AI development best practices. These templates codify design principles, information architecture, and UX standards refined across multiple production projects (AIQ, MatchFlow).

## What's Included

### Core Templates

```
.project-templates/
├── .agent-os/
│   ├── config.template.yml          # Agent-OS configuration with placeholders
│   ├── README.template.md           # Agent-OS setup guide
│   ├── instructions/
│   │   ├── compliance/
│   │   │   ├── mission-alignment.template.md
│   │   │   ├── design-system.template.md
│   │   │   └── roadmap-compliance.template.md
│   │   ├── design/
│   │   │   ├── information-architecture.template.md
│   │   │   ├── ux-principles.template.md
│   │   │   ├── visual-design-laws.template.md
│   │   │   └── design-review-checklist.template.md
│   │   └── core/
│   │       └── development-protocol.template.md
│   ├── roles/
│   │   ├── implementers.template.yml
│   │   └── verifiers.template.yml
│   └── workflows/
│       └── implementation-modes.template.md
├── .claude/
│   ├── AGENTS.template.md
│   ├── README.template.md
│   ├── context.template.md
│   └── decision-framework.template.md
├── CLAUDE.template.md                # Main AI instructions file
└── README.md                         # This file

```

### Template Origins

These templates are abstracted from production projects:

1. **AIQ** (Internal Consulting Platform)
   - Information Architecture principles
   - UX principles for data-dense B2B interfaces
   - Design system compliance (shadcn/ui, dark mode)
   - Strategic positioning enforcement

2. **MatchFlow** (Tournament Management SaaS)
   - Visual design laws (Gestalt principles)
   - Touch target sizing (Fitts's Law)
   - Cognitive load management (Miller's Law)
   - Design system templates

## Quick Start

### 1. Copy Templates to New Project

```bash
# Navigate to your new project
cd /path/to/your/project

# Copy the template structure
cp -r ~/Workspace/.project-templates/.agent-os .
cp -r ~/Workspace/.project-templates/.claude .
cp ~/Workspace/.project-templates/CLAUDE.template.md CLAUDE.md

# Remove .template extensions
find .agent-os .claude -name "*.template.*" -exec bash -c 'mv "$1" "${1/.template/}"' _ {} \;
```

### 2. Replace Placeholders

Search for `{PLACEHOLDER}` markers in all files and replace with project-specific values.

**Key Placeholders:**

```yaml
# Project Identity
{PROJECT_NAME}                 # e.g., "AIQ", "MatchFlow", "MyApp"
{PROJECT_DESCRIPTION}          # One-line description
{PROJECT_TYPE}                 # web-app | api | library | saas | internal-tool

# Business Context
{BUSINESS_MODEL}               # SaaS | service-delivery | internal-platform | open-source
{PRIMARY_USER}                 # end-customer | internal-team | consultant | developer
{CORE_VALUE_PROPOSITION}       # What problem does this solve
{TARGET_AUDIENCE}              # Who uses this (e.g., "Consultants", "Tournament Organizers")

# Technical Stack
{FRAMEWORK}                    # Next.js | React | Vue | etc.
{LANGUAGE}                     # TypeScript | JavaScript | Python
{CSS_FRAMEWORK}                # Tailwind | CSS Modules | Styled Components
{COMPONENT_LIBRARY}            # shadcn/ui | Material-UI | custom
{DATABASE}                     # Supabase | PostgreSQL | MongoDB

# Design System
{DESIGN_SYSTEM_SOURCE}         # tailwind.config.ts | design-tokens.json
{COMPONENT_PATH}               # components/ui | src/components
{COMPONENT_IMPORT_PATH}        # @/components/ui | @/ui
{PRIMARY_BRAND_COLOR}          # #5B7CFF
{THEME_MODE}                   # dark | light | system
{FONT_FAMILY_PRIMARY}          # Inter | Roboto | system-ui
{FONT_FAMILY_MONO}             # JetBrains Mono | Fira Code

# Roadmap
{TOTAL_PHASES}                 # Number of phases in roadmap
{CURRENT_PHASE}                # Current phase name
{CURRENT_PHASE_WEEKS}          # Duration of current phase

# Strategic Documents
{STRATEGIC_DOC_PATH}           # docs/strategy/README.md
{PRD_PATH}                     # docs/prd.md
{ROADMAP_DOC_PATH}             # docs/roadmap.md
```

### 3. Customize for Your Project

After replacing placeholders:

1. **Review Information Architecture template**
   - Adapt navigation structure to your user mental model
   - Define page-specific IA guidelines
   - Set content hierarchy priorities

2. **Review UX Principles template**
   - Add project-specific interaction patterns
   - Define loading states and feedback mechanisms
   - Establish accessibility requirements

3. **Review Visual Design Laws template**
   - Apply Gestalt principles to your components
   - Set touch target sizes for your platform
   - Define spacing and proximity rules

4. **Review Design System Compliance**
   - Configure color palette
   - Set typography scale
   - Define component usage patterns

## Template Philosophy

### 1. Abstraction Over Prescription

Templates use `{PLACEHOLDER}` markers rather than hardcoded values. This forces intentional customization and prevents copy-paste errors.

### 2. Evidence-Based Patterns

All patterns are derived from production projects, not theoretical ideals. Every principle has been validated through real-world usage.

### 3. Enforcement Over Documentation

Templates include **auto-rejection triggers** and **validation checklists**. Compliance is enforced by Agent-OS, not just documented.

### 4. Progressive Disclosure

Templates start simple and reveal complexity as needed. Core principles are mandatory; advanced patterns are optional.

## Usage Patterns

### For New Projects (30 min setup)

**Ideal for:** Greenfield projects with clear requirements

```bash
# 1. Copy templates
cp -r ~/Workspace/.project-templates/.agent-os .
cp -r ~/Workspace/.project-templates/.claude .
cp ~/Workspace/.project-templates/CLAUDE.template.md CLAUDE.md

# 2. Remove .template
find . -name "*.template.*" -exec bash -c 'mv "$1" "${1/.template/}"' _ {} \;

# 3. Replace placeholders (automated)
./replace-placeholders.sh  # See script template below

# 4. Review and customize
# Focus on IA, UX principles, design system
```

### For Existing Projects (2-4 hours retrofit)

**Ideal for:** Projects needing structure and consistency

```bash
# 1. Cherry-pick templates
cp ~/Workspace/.project-templates/.agent-os/instructions/design/information-architecture.template.md \
   .agent-os/instructions/design/information-architecture.md

# 2. Adapt incrementally
# Start with one template, validate, then add more

# 3. Document deviations
# If you can't follow a template principle, document why
```

## Template Catalog

### Information Architecture (`design/information-architecture.template.md`)

**Purpose:** Defines how information is organized, structured, and presented

**Derived from:** AIQ (consultant-facing B2B platform)

**Key Principles:**
- Task-oriented structure (not database-driven)
- Content hierarchy (pyramid model)
- Mental model alignment
- Progressive disclosure
- Search & findability

**Use when:**
- Building multi-page applications
- Complex navigation requirements
- Data-dense dashboards
- User task flows

### UX Principles (`design/ux-principles.template.md`)

**Purpose:** Defines interaction patterns and user experience standards

**Derived from:** AIQ (Nielsen's heuristics + B2B patterns)

**Key Principles:**
- Recognition over recall
- Progressive disclosure
- Feedback & system status
- Error prevention
- Consistency & standards
- Flexibility & efficiency
- Aesthetic & minimalist design
- Accessibility (WCAG AA)

**Use when:**
- Defining interaction patterns
- Setting feedback mechanisms
- Establishing accessibility requirements
- Creating loading states

### Visual Design Laws (`design/visual-design-laws.template.md`)

**Purpose:** Applies fundamental design laws and Gestalt principles

**Derived from:** MatchFlow (volleyball tournament management SaaS)

**Key Principles:**
- Gestalt principles (proximity, similarity, continuity)
- Visual hierarchy laws (size, color, position)
- Fitts's Law (touch targets)
- Hick's Law (decision making)
- Miller's Law (cognitive load)
- Jakob's Law (user expectations)

**Use when:**
- Designing visual components
- Setting spacing and layout rules
- Defining touch targets
- Reducing cognitive load

### Design System Compliance (`compliance/design-system.template.md`)

**Purpose:** Enforces visual consistency through component and token standards

**Derived from:** Both AIQ and MatchFlow

**Key Principles:**
- Color system (semantic + brand)
- Typography system
- Component patterns
- Accessibility (WCAG AA)
- Auto-rejection triggers

**Use when:**
- Enforcing design system adherence
- Preventing visual inconsistencies
- Maintaining component library usage
- Ensuring accessibility compliance

## Advanced Features

### Auto-Rejection Triggers

Templates include validation rules that trigger Agent-OS auto-rollback:

**Example (Design System):**
```yaml
# .agent-os/config.yml
compliance:
  design_system:
    auto_reject:
      - pattern: 'style=".*"'
        reason: "Inline styles forbidden"
      - pattern: 'bg-blue-500'
        reason: "Use semantic color: bg-brand-500"
```

### Validation Checklists

Templates include pre/post implementation checklists:

**Example (IA):**
```markdown
### Pre-Implementation:
- [ ] Can users complete their task without remembering information?
- [ ] Is content hierarchy clear (primary → secondary → tertiary)?
- [ ] Are navigation labels task-oriented (not technical)?

### Post-Implementation:
- [ ] Can users find any content in ≤3 clicks?
- [ ] Are active navigation states clearly indicated?
- [ ] Do breadcrumbs show accurate hierarchy?
```

### Commit Message Templates

Templates enforce documentation through commit message format:

```markdown
feat(Phase 1, Week 2): Add user authentication

Strategic Alignment:
- Internal platform: Supports consultant login workflow
- Service generation: Enables client data isolation

Design System:
- Uses shadcn/ui Button component
- Brand color #5B7CFF for primary CTA
- WCAG AA contrast verified

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Template Maintenance

### Backporting Improvements

After learning from a project, backport improvements to templates:

```bash
cd ~/Workspace/.project-templates

# 1. Abstract project-specific details
# Replace concrete values with {PLACEHOLDER}

# 2. Update template
# Add new patterns or anti-patterns

# 3. Version and document
# Update README with changes
```

### Versioning

Templates follow semantic versioning:

- **Major (1.0.0 → 2.0.0):** Breaking changes to structure or placeholders
- **Minor (1.0.0 → 1.1.0):** New templates or significant additions
- **Patch (1.0.0 → 1.0.1):** Fixes, clarifications, minor improvements

## Replacement Script Template

Create `replace-placeholders.sh` in your project:

```bash
#!/bin/bash

# Configuration
PROJECT_NAME="YourProjectName"
PROJECT_DESCRIPTION="Brief description"
PROJECT_TYPE="web-app"
BUSINESS_MODEL="SaaS"
PRIMARY_USER="end-customer"

# Design System
PRIMARY_BRAND_COLOR="#5B7CFF"
THEME_MODE="dark"
COMPONENT_LIBRARY="shadcn/ui"

# Replace placeholders
find .agent-os .claude CLAUDE.md -type f -exec sed -i '' \
  -e "s/{PROJECT_NAME}/$PROJECT_NAME/g" \
  -e "s/{PROJECT_DESCRIPTION}/$PROJECT_DESCRIPTION/g" \
  -e "s/{PROJECT_TYPE}/$PROJECT_TYPE/g" \
  -e "s/{BUSINESS_MODEL}/$BUSINESS_MODEL/g" \
  -e "s/{PRIMARY_USER}/$PRIMARY_USER/g" \
  -e "s/{PRIMARY_BRAND_COLOR}/$PRIMARY_BRAND_COLOR/g" \
  -e "s/{THEME_MODE}/$THEME_MODE/g" \
  -e "s/{COMPONENT_LIBRARY}/$COMPONENT_LIBRARY/g" \
  {} +

echo "✅ Placeholders replaced. Review files and customize further."
```

## Examples

### AIQ (Source Project)

**Configuration:**
```yaml
PROJECT_NAME: AIQ
PROJECT_TYPE: Internal Platform
BUSINESS_MODEL: Service Delivery
PRIMARY_USER: Consultants
COMPONENT_LIBRARY: shadcn/ui
THEME_MODE: dark
```

**Templates Used:**
- Information Architecture
- UX Principles
- Design System Compliance
- Mission Alignment
- Roadmap Compliance

### MatchFlow (Source Project)

**Configuration:**
```yaml
PROJECT_NAME: MatchFlow
PROJECT_TYPE: SaaS
BUSINESS_MODEL: Subscription
PRIMARY_USER: Tournament Organizers
COMPONENT_LIBRARY: shadcn/ui
THEME_MODE: light
```

**Templates Used:**
- Visual Design Laws
- Design System Compliance
- UX Principles

## Troubleshooting

### Placeholder Not Found

**Problem:** `{SOME_PLACEHOLDER}` not in your project context

**Solution:** Either:
1. Add the placeholder to your context (recommended)
2. Remove the section using it (if not applicable)
3. Replace with closest equivalent placeholder

### Template Too Prescriptive

**Problem:** Template pattern doesn't fit your use case

**Solution:**
1. Document deviation in commit message
2. Update local template for future reference
3. Consider backporting generalization to master template

### Template Too Abstract

**Problem:** Need more concrete examples

**Solution:**
1. Review source projects (AIQ, MatchFlow)
2. Copy concrete example, then abstract it
3. Contribute back to template with `{PLACEHOLDER}` markers

## Contributing

### Adding New Templates

1. Build feature in a project
2. Extract pattern to template
3. Replace specifics with `{PLACEHOLDER}`
4. Add to `.project-templates/`
5. Document in this README

### Improving Existing Templates

1. Identify issue in production usage
2. Fix in project context
3. Backport fix to template
4. Version and document change

## Resources

- **AIQ Source:** `/Users/nino/Workspace/02-local-dev/apps/aiq/`
- **MatchFlow Source:** `/Users/nino/Workspace/02-local-dev/apps/match-flow/`
- **Agent-OS Docs:** `.agent-os/README.md` (in each project)
- **Claude Code Docs:** `https://docs.claude.com/en/docs/claude-code`

---

**Version:** 1.0.0
**Last Updated:** 2025-10-25
**Maintained by:** Nino
**Feedback:** Update this README as templates evolve
