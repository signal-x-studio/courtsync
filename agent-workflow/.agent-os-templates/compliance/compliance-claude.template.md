# Compliance Framework Section for CLAUDE.md

**Instructions:** Add this section to your CLAUDE.md file after the "Agent Operating System" section.

---

## Compliance Framework (MANDATORY)

**Version:** 1.0.0
**Status:** ENFORCED - All work must comply
**Last Updated:** {CREATION_DATE}

### Overview

The Compliance Framework ensures all development aligns with {PROJECT_NAME}'s strategic positioning, business model, design system, and implementation roadmap. Violations trigger auto-rollback.

### Strategic Documents (MUST READ)

Before implementing ANY feature:

1. **{STRATEGIC_DOC_NAME}** (`{STRATEGIC_DOC_PATH}`)
   - {STRATEGIC_DOC_KEY_POINT_1}
   - {STRATEGIC_DOC_KEY_POINT_2}
   - {STRATEGIC_DOC_KEY_POINT_3}

2. **{PRD_NAME}** (`{PRD_PATH}`)
   - {PRD_KEY_POINT_1}
   - {PRD_KEY_POINT_2}
   - {PRD_KEY_POINT_3}

3. **{ROADMAP_NAME}** (`{ROADMAP_DOC_PATH}`)
   - Current Phase: {CURRENT_PHASE_NAME} ({CURRENT_PHASE_TIMELINE})
   - {ROADMAP_KEY_POINT_1}
   - {ROADMAP_KEY_POINT_2}

4. **{DESIGN_DOC_NAME}** (`{DESIGN_SYSTEM_SOURCE}`) *(for UI work)*
   - {DESIGN_KEY_POINT_1}
   - {DESIGN_KEY_POINT_2}
   - {DESIGN_KEY_POINT_3}

### Core Principles (Non-Negotiable)

**What {PROJECT_NAME} IS:**
- ✅ {CORE_PRINCIPLE_1}
- ✅ {CORE_PRINCIPLE_2}
- ✅ {CORE_PRINCIPLE_3}
- ✅ {CORE_PRINCIPLE_4}

**What {PROJECT_NAME} IS NOT:**
- ❌ NOT {ANTI_POSITIONING_1}
- ❌ NOT {ANTI_POSITIONING_2}
- ❌ NOT {ANTI_POSITIONING_3}
- ❌ NOT {ANTI_POSITIONING_4}

### Pre-Implementation Validation (REQUIRED)

**Before writing ANY code:**

#### Mission & PRD Alignment
- [ ] Read relevant section of {STRATEGIC_DOC_NAME}
- [ ] Verify feature aligns with at least ONE core principle
- [ ] Check feature is NOT in "What {PROJECT_NAME} IS NOT" list
- [ ] Confirm {PRIMARY_USER} workflow is supported

#### Business Model Alignment
- [ ] Feature supports {BUSINESS_MODEL_TYPE}
- [ ] Feature designed for {PRIMARY_USER} users
- [ ] Feature enables {KEY_CAPABILITY_1}
- [ ] Feature enhances {PRIMARY_FRAMEWORK} *(if applicable)*
- [ ] Feature does NOT {BUSINESS_MODEL_VIOLATION_EXAMPLE}

#### Roadmap Phase Alignment
- [ ] Task listed in {CURRENT_PHASE_NAME} deliverables
- [ ] All prerequisite phases complete
- [ ] Task NOT in future phase scope
- [ ] Dependencies satisfied

#### Design System Alignment *(for UI work)*
- [ ] Read {DESIGN_DOC_NAME}
- [ ] Identified {COMPONENT_LIBRARY} components to use
- [ ] Colors from {COLOR_SYSTEM} palette
- [ ] Typography from {TYPOGRAPHY_SYSTEM}
- [ ] Accessibility requirements ({WCAG_LEVEL}, {CONTRAST_RATIO})

### Post-Implementation Requirements (MANDATORY)

**Commit message MUST include:**

```
feat(Phase {N}): {FEATURE_DESCRIPTION}

Strategic Alignment:
- {PRINCIPLE_1_NAME}: {HOW_FEATURE_ALIGNS}
- {PRINCIPLE_2_NAME}: {HOW_FEATURE_ALIGNS}

Business Model: Supports {BUSINESS_MODEL_TYPE}
Roadmap: Phase {N} ({PHASE_TIMELINE}) - {PHASE_FOCUS}

[Implementation details, testing, etc.]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Required citations:**
- Strategic positioning document
- Roadmap phase
- Design system compliance *(for UI work)*

### Auto-Rejection Triggers (Will Cause Rollback)

#### ❌ Mission Principle Violations
- {STRATEGIC_VIOLATION_1}
- {STRATEGIC_VIOLATION_2}
- {STRATEGIC_VIOLATION_3}
- {STRATEGIC_VIOLATION_4}

#### ❌ Business Model Violations
- {BUSINESS_VIOLATION_1}
- {BUSINESS_VIOLATION_2}
- {BUSINESS_VIOLATION_3}
- {BUSINESS_VIOLATION_4}

#### ❌ Roadmap Scope Violations
- Phase {N}+ features during Phase {M}
- {FUTURE_FEATURE_1} before Phase {P}
- Features not in {TOTAL_TIMELINE} roadmap
- Work with incomplete dependencies

#### ❌ Design System Violations *(for UI work)*
- Not using {COMPONENT_LIBRARY} components
- Random hex colors (not from design system)
- Custom font imports
- Contrast ratios < {CONTRAST_RATIO}
- Missing accessibility features

### {PRIMARY_USER} Workflow (Core User Journey)

**This workflow MUST be supported by all features:**

1. {WORKFLOW_STEP_1}
2. {WORKFLOW_STEP_2}
3. {WORKFLOW_STEP_3}
4. {WORKFLOW_STEP_4}
5. {WORKFLOW_STEP_5}
6. {WORKFLOW_STEP_6}
7. {WORKFLOW_STEP_7}

*Any feature that disrupts this flow is non-compliant.*

### Quick Reference: Build vs Reject

#### ✅ BUILD (Aligned Features)

**{PRIMARY_USER} Workflow:**
- {ALIGNED_FEATURE_1}
- {ALIGNED_FEATURE_2}
- {ALIGNED_FEATURE_3}

**{PROJECT_TYPE} Platform:**
- {PLATFORM_FEATURE_1}
- {PLATFORM_FEATURE_2}
- {PLATFORM_FEATURE_3}

**{BUSINESS_MODEL_TYPE}:**
- {BUSINESS_FEATURE_1}
- {BUSINESS_FEATURE_2}
- {BUSINESS_FEATURE_3}

#### ❌ REJECT (Non-Aligned Features)

**{WRONG_USER_TYPE}-Facing:**
- {REJECT_FEATURE_1}
- {REJECT_FEATURE_2}
- {REJECT_FEATURE_3}

**{ANTI_POSITIONING_1}:**
- {REJECT_FEATURE_4}
- {REJECT_FEATURE_5}
- {REJECT_FEATURE_6}

**Standalone Tool Anti-Patterns:**
- {REJECT_FEATURE_7}
- {REJECT_FEATURE_8}
- {REJECT_FEATURE_9}

### Workflow Mode Guidance

**{FAST_MODE_NAME}** ({FAST_MODE_TOKEN_SAVINGS}% token savings):
- {FAST_MODE_USE_CASE_1}
- {FAST_MODE_USE_CASE_2}
- Self-check against strategic positioning

**{NORMAL_MODE_NAME}** ({NORMAL_MODE_TOKEN_SAVINGS}% token savings) ⭐ DEFAULT:
- {NORMAL_MODE_USE_CASE_1}
- {NORMAL_MODE_USE_CASE_2}
- Full strategic alignment verification

**{CAREFUL_MODE_NAME}** (Baseline speed):
- {CAREFUL_MODE_USE_CASE_1}
- {CAREFUL_MODE_USE_CASE_2}
- Comprehensive compliance review

### Compliance Documents

**Full enforcement instructions:**
- `.agent-os/instructions/compliance/mission-alignment.md` - Strategic positioning
- `.agent-os/instructions/compliance/roadmap-compliance.md` - Phase discipline
- `.agent-os/instructions/compliance/design-system.md` - Visual consistency *(for UI work)*

**Configuration:**
- `.agent-os/config.yml` - Compliance enabled, auto-rejection triggers defined

**Audit Trail:**
- `.agent-os/audit-logs/` - All compliance decisions logged

---

**Enforcement Status:** ACTIVE
**Review Frequency:** After each phase completion
**Violations:** Report to `.agent-os/audit-logs/`
