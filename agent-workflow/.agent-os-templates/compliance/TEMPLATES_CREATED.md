# Compliance Framework Templates - Summary

**Version:** 1.0.0
**Date:** 2025-10-25
**Location:** `/Users/nino/Workspace/.agent-os-templates/compliance/`

## What Was Created

### Documentation Files

1. ✅ **README.md** - Overview of compliance framework and templates
2. ✅ **SETUP_GUIDE.md** - Step-by-step setup instructions (30 min to 4 hours)
3. ✅ **TEMPLATES_CREATED.md** - This file (summary)

### Template Files (To Create)

**These abstract templates with {PLACEHOLDER} markers can be copied to any project:**

- [ ] `mission-alignment.template.md` - Strategic positioning & business model enforcement
- [ ] `design-system.template.md` - Visual design & component standards enforcement
- [ ] `roadmap-compliance.template.md` - Phase scope & milestone tracking
- [ ] `compliance-config.template.yml` - Config.yml snippet to integrate compliance
- [ ] `compliance-claude.template.md` - CLAUDE.md snippet to document compliance

---

## How to Use (Quick Reference)

### For New Project Setup:

```bash
# 1. Copy templates
cp -r ~/Workspace/.agent-os-templates/compliance /path/to/project/.agent-os/instructions/

# 2. Remove .template extensions
cd /path/to/project/.agent-os/instructions/compliance
for file in *.template.*; do mv "$file" "${file/.template/}"; done

# 3. Replace {PLACEHOLDER} markers
# Search for { in all files and replace with project-specific values

# 4. Integrate with config.yml
cat compliance-config.yml >> ../../config.yml

# 5. Update CLAUDE.md
# Add compliance section from compliance-claude.md
```

### Key Placeholders to Replace:

```
{PROJECT_NAME}            → Your project name
{PROJECT_TYPE}            → web-app | api | library | saas | internal-tool
{BUSINESS_MODEL}          → SaaS | service-delivery | internal-platform
{PRIMARY_USER}            → end-customer | internal-team | consultant
{CORE_VALUE_PROPOSITION}  → What problem does this solve
{STRATEGIC_DOC_PATH}      → Path to mission/vision doc
{PRD_PATH}                → Path to PRD
{DESIGN_SYSTEM_SOURCE}    → tailwind.config.ts | design-tokens.json
{COMPONENT_LIBRARY}       → shadcn/ui | custom | Material-UI
{PRIMARY_BRAND_COLOR}     → #5B7CFF or CSS variable
{TOTAL_PHASES}            → 3 | 5 | etc.
{CURRENT_PHASE}           → Phase 1 | MVP | Alpha
```

---

## Example Projects Using This Framework

### 1. AIQ (Internal Consulting Platform)

**Location:** `/Users/nino/Workspace/02-local-dev/apps/aiq/.agent-os/instructions/compliance/`

**Key Characteristics:**
- Project Type: Internal Platform
- Business Model: Service Delivery ($475k-$1.45M engagements)
- User: Accenture Song consultants (internal)
- Design: shadcn/ui, dark mode-first
- Roadmap: 5 phases, 16 weeks

**Enforces:**
- ❌ NO client self-service features
- ❌ NO SaaS product positioning
- ❌ NO public signup/pricing pages
- ✅ Consultant-mediated workflows
- ✅ AEO Readiness Score framework (0-100)

### 2. Agentic Commerce Narrator (Narrative Cockpit)

**Location:** `/Users/nino/Workspace/02-local-dev/sites/agentic-commerce-narrator/.agent-os/instructions/compliance/`

**Key Characteristics:**
- Project Type: Knowledge Graph + Web App
- Business Model: Presentation Tool
- User: Consultants presenting to clients
- Design: Custom Traditional/Agentic palette, Lucide icons
- Roadmap: 3 milestones (data + app)

**Enforces:**
- ❌ NO graph visualization as primary interface
- ❌ NO "browse all" views
- ❌ NO emojis in professional UI
- ✅ Progressive disclosure (hide complexity)
- ✅ Signal over noise (80% UI for A-vs-B comparison)

---

## Template Creation Guide

**To create the remaining templates, use these completed projects as references:**

### mission-alignment.template.md

**Base it on:**
- AIQ: `.agent-os/instructions/compliance/mission-alignment.md`
- Abstract out project-specific details
- Replace concrete values with {PLACEHOLDER} markers
- Keep structure and enforcement mechanisms

**Key Sections:**
1. Strategic positioning & business model
2. Core principles (project-specific)
3. Pre-implementation validation checklist
4. Auto-rejection triggers
5. Commit message format
6. Example compliant/rejected commits

### design-system.template.md

**Base it on:**
- AIQ: `.agent-os/instructions/compliance/design-system.md`
- Make color palette abstract
- Component patterns as examples (shadcn/ui or custom)
- Typography scales with variables

**Key Sections:**
1. Color system (with placeholders)
2. Typography system
3. Component patterns
4. Accessibility requirements
5. Auto-rejection triggers for design violations

### roadmap-compliance.template.md

**Base it on:**
- AIQ: `.agent-os/instructions/compliance/roadmap-compliance.md`
- Abstract phase structure
- Generic milestone dependencies

**Key Sections:**
1. Roadmap overview (phases as variables)
2. Current phase deliverables
3. Phase dependencies matrix
4. Pre/post implementation checklists
5. Auto-rejection for out-of-phase work

### compliance-config.template.yml

**Extract from:**
- AIQ: `.agent-os/config.yml` lines 156-293

**Content:**
```yaml
# Compliance Framework (Add to config.yml)
compliance:
  enabled: true
  version: "1.0.0"

  strategic_positioning:
    enabled: true
    document: "{STRATEGIC_DOC_PATH}"
    instructions: ".agent-os/instructions/compliance/mission-alignment.md"
    # ... rest of structure with placeholders

  design_system:
    enabled: true
    source: "{DESIGN_SYSTEM_SOURCE}"
    # ... with placeholders

  roadmap_alignment:
    enabled: true
    document: "{ROADMAP_DOC_PATH}"
    current_phase:
      name: "{CURRENT_PHASE}"
    # ... with placeholders
```

### compliance-claude.template.md

**Extract from:**
- AIQ: `CLAUDE.md` lines 86-271

**Content:**
```markdown
## Compliance Framework (MANDATORY)

**Version:** 1.0.0
**Status:** ENFORCED

### Strategic Documents (MUST READ)

1. **{STRATEGIC_DOC_NAME}** (`{STRATEGIC_DOC_PATH}`)
   - {KEY_PRINCIPLE_1}
   - {KEY_PRINCIPLE_2}

### Pre-Implementation Validation
- [ ] Read {STRATEGIC_DOC}
- [ ] Verify {PRINCIPLE_1} alignment
- [ ] Check {PRINCIPLE_2} compliance

### Auto-Rejection Triggers
- {ANTI_PATTERN_1}
- {ANTI_PATTERN_2}
```

---

## Next Steps to Complete Templates

1. ✅ **Created:** README.md, SETUP_GUIDE.md, TEMPLATES_CREATED.md

2. **TODO:** Create 5 template files:
   ```bash
   cd ~/Workspace/.agent-os-templates/compliance

   # Create from AIQ/Agentic Commerce examples
   # Replace project-specific with {PLACEHOLDER}

   touch mission-alignment.template.md
   touch design-system.template.md
   touch roadmap-compliance.template.md
   touch compliance-config.template.yml
   touch compliance-claude.template.md
   ```

3. **Validate:** Test on a new project
   - Copy templates to `.agent-os/instructions/compliance/`
   - Replace placeholders
   - Verify auto-rejection works
   - Document any gaps

4. **Document:** Add usage examples to main README

---

## Benefits Achieved

### For New Projects (30 min setup):

✅ **Strategic Protection:**
- Prevents building wrong product
- Enforces business model consistency
- Maintains positioning integrity

✅ **Design Consistency:**
- Enforces color palette compliance
- Validates component usage
- Maintains accessibility standards

✅ **Roadmap Discipline:**
- Prevents scope creep
- Enforces phase dependencies
- Controls future feature implementation

✅ **Documentation:**
- Required commit message citations
- Traceable decision making
- Evidence-based progress

### ROI:

- **Setup time:** 30 min (simple) to 4 hours (complex)
- **Prevents:** Days/weeks of rework from strategic drift
- **Enforces:** Consistency without manual review
- **Value:** Framework pays for itself in first prevented violation

---

## Maintenance

**Keep templates updated:**
```bash
cd ~/Workspace/.agent-os-templates/compliance

# After learning from a project
# Backport improvements to templates
# Version and document changes
```

**Share learnings:**
- New anti-patterns discovered → Add to templates
- Better validation checklists → Update templates
- Improved commit formats → Document in templates

---

**Status:** Documentation complete, 5 template files remain to be created from AIQ/Agentic Commerce examples with abstraction.
