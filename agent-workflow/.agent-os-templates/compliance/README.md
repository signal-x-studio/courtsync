# Compliance Framework Templates

**Version:** 1.0.0
**Last Updated:** 2025-10-25
**Purpose:** Abstract, reusable compliance templates for protecting project intent, design decisions, and strategic positioning

## Overview

The Compliance Framework provides enforceable guardrails that prevent:
- ❌ Strategic drift (building wrong product)
- ❌ Design inconsistency (visual chaos)
- ❌ Scope creep (future features during MVP)
- ❌ Business model violations (building opposite of intended model)

## What This Framework Does

**Before Implementation:**
- AI assistant MUST read strategic documents
- AI assistant MUST verify feature alignment
- AI assistant MUST check design system compliance
- AI assistant MUST confirm roadmap scope

**After Implementation:**
- AI assistant MUST cite strategic positioning in commits
- AI assistant MUST reference roadmap phase
- AI assistant MUST document design compliance
- Auto-rollback triggers on violations

---

## Template Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `mission-alignment.template.md` | Strategic positioning & business model | Every project |
| `design-system.template.md` | Visual design & component standards | UI/UX projects |
| `roadmap-compliance.template.md` | Phase scope & milestone tracking | Phased implementations |
| `compliance-config.template.yml` | Agent-OS config snippet | Every project |
| `compliance-claude.template.md` | CLAUDE.md snippet | Every project |
| `SETUP_GUIDE.md` | Step-by-step setup instructions | Reference when setting up |

---

## Quick Start

### 1. Copy Templates to Your Project

```bash
# From your project root
cp -r ~/Workspace/.agent-os-templates/compliance .agent-os/instructions/

# Clean up
rm .agent-os/instructions/compliance/README.md
rm .agent-os/instructions/compliance/SETUP_GUIDE.md
```

### 2. Replace Placeholders

Search for `{PLACEHOLDER}` markers and replace with project-specific values:

```bash
# Find all placeholders
grep -r "{" .agent-os/instructions/compliance/

# Common placeholders:
{PROJECT_NAME}
{PROJECT_TYPE}
{BUSINESS_MODEL}
{CORE_PRINCIPLES}
{STRATEGIC_DOCS}
{DESIGN_SYSTEM}
{TECH_STACK}
{ROADMAP_PHASES}
```

### 3. Integrate with Agent-OS

Add compliance section to `.agent-os/config.yml`:
```bash
cat .agent-os/instructions/compliance/compliance-config.template.yml >> .agent-os/config.yml
```

### 4. Update CLAUDE.md

Add compliance section:
```bash
# Copy compliance section and paste into CLAUDE.md after "Agent Operating System" section
```

---

## When to Use Which Templates

### mission-alignment.template.md

**Use for:**
- All projects (foundational)
- Protecting strategic positioning
- Preventing business model violations
- Enforcing core principles

**Examples:**
- SaaS vs Internal Tool distinction
- B2B vs B2C positioning
- Service-based vs Product-based revenue
- Key user workflows that must be supported

### design-system.template.md

**Use for:**
- UI/UX projects (web apps, mobile apps)
- Component libraries
- Design systems
- User-facing applications

**Skip for:**
- Pure backend APIs (no UI)
- CLI tools
- Data pipelines
- Infrastructure projects

### roadmap-compliance.template.md

**Use for:**
- Phased implementations (MVP → Phase 2 → Phase 3)
- Long-term projects (> 8 weeks)
- Projects with clear milestone dependencies

**Skip for:**
- Single-sprint features
- Maintenance work
- Bug fixes
- Simple enhancements

---

## Customization Guide

### Low Customization (< 30 min)

**Simple web app, clear positioning:**
1. Replace placeholders in mission-alignment.template.md
2. Update design-system.template.md with color palette
3. Skip roadmap-compliance.template.md if single sprint
4. Add to config.yml and CLAUDE.md
5. Done

### Medium Customization (1-2 hours)

**Complex app with multiple phases:**
1. Full mission-alignment.template.md customization
2. Design-system.template.md with custom components
3. Roadmap-compliance.template.md with 3-5 phases
4. Add specific anti-patterns to auto-reject list
5. Custom validation checklists
6. Add to config.yml and CLAUDE.md

### High Customization (4-8 hours)

**Enterprise platform, strict requirements:**
1. Comprehensive mission-alignment.template.md
2. Detailed design-system.template.md (full component library)
3. Roadmap-compliance.template.md with complex dependencies
4. Custom compliance documents (security, performance, etc.)
5. Integration with CI/CD validation
6. Team training on compliance framework

---

## Example Projects

### Internal Consulting Platform (AIQ Model)

**Strategic Positioning:**
- Internal tool (NOT client-facing SaaS)
- Service generation engine
- Consultant-mediated (no client self-service)

**Auto-Rejects:**
- Client signup flows
- Public pricing pages
- SaaS product features

**See:** `~/Workspace/02-local-dev/apps/aiq/.agent-os/instructions/compliance/`

### Narrative Cockpit Tool (Agentic Commerce Narrator Model)

**Strategic Positioning:**
- Consultant presentation tool
- Progressive disclosure (hide complexity)
- Data hierarchy is navigation
- Professional B2B aesthetic

**Auto-Rejects:**
- Graph visualization as primary interface
- Browse all capabilities view
- Emojis in UI
- Custom navigation modes

**See:** `~/Workspace/02-local-dev/sites/agentic-commerce-narrator/.agent-os/instructions/compliance/`

---

## Maintenance

### When to Update Compliance Docs

- Strategic positioning changes
- New business model decisions
- Design system evolution
- Roadmap phase transitions
- Anti-pattern discoveries

### Keeping Templates in Sync

```bash
# After updating a project's compliance docs
# If changes are general-purpose, backport to templates

# Example: New anti-pattern discovered
cd ~/Workspace/.agent-os-templates/compliance
# Update mission-alignment.template.md with new anti-pattern
# Document in CHANGELOG
```

---

## Benefits

### For AI Assistants

- ✅ Clear validation checklists before coding
- ✅ Explicit auto-rejection triggers
- ✅ Required commit message format
- ✅ Design system reference

### For Teams

- ✅ Prevents strategic drift
- ✅ Enforces design consistency
- ✅ Controls scope creep
- ✅ Documents decisions

### For Projects

- ✅ Mission integrity maintained
- ✅ Visual consistency enforced
- ✅ Roadmap discipline
- ✅ Traceable decisions

---

## Troubleshooting

### AI Assistant Ignoring Compliance

**Problem:** AI assistant not reading strategic docs

**Solution:**
- Ensure `.agent-os/config.yml` has `compliance.enabled: true`
- Verify compliance section exists in `CLAUDE.md`
- Check pre-flight gates list compliance checks

### Too Many False Positives

**Problem:** Auto-rollback triggering too often

**Solution:**
- Review auto-reject triggers
- Make anti-patterns more specific
- Separate "violations" from "warnings"
- Adjust for project maturity

### Compliance Overhead Too High

**Problem:** Slowing down development

**Solution:**
- Use fast mode for most work (self-check only)
- Reserve comprehensive review for careful/thorough mode
- Batch similar features to amortize compliance cost
- Simplify checklist for mature projects

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-25 | Initial compliance framework templates |

---

**Next:** See `SETUP_GUIDE.md` for detailed setup instructions
