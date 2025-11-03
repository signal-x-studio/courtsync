# Mission & Strategy Compliance Instructions

**Version:** 1.0.0
**Date:** {CREATION_DATE}
**Enforcement:** MANDATORY
**Applies To:** All workflow modes

## Purpose

This document provides enforceable validation checklists to ensure all development work aligns with {PROJECT_NAME}'s strategic positioning, business model, and implementation roadmap. Non-compliance will trigger auto-rollback.

---

## Core Strategic Documents (MUST READ)

Before implementing ANY feature, you MUST verify alignment with:

### 1. Strategic Overview (`{STRATEGIC_DOC_PATH}`)

**What {PROJECT_NAME} IS:**
- {CORE_POSITIONING_1}
- {CORE_POSITIONING_2}
- {CORE_POSITIONING_3}

**What {PROJECT_NAME} IS NOT:**
- ❌ NOT {ANTI_POSITIONING_1}
- ❌ NOT {ANTI_POSITIONING_2}
- ❌ NOT {ANTI_POSITIONING_3}
- ❌ NOT {ANTI_POSITIONING_4}

**Core Value Proposition:**
> "{CORE_VALUE_PROPOSITION}"

**{PRIMARY_FRAMEWORK_NAME} (if applicable):**
- {FRAMEWORK_COMPONENT_1}
- {FRAMEWORK_COMPONENT_2}
- {FRAMEWORK_COMPONENT_3}
- {FRAMEWORK_COMPONENT_4}

### 2. Product Requirements (`{PRD_PATH}`)

**Current Implementation Status:**
- {COMPLETION_PERCENTAGE}% complete ({TECH_STACK})
- {IMPLEMENTED_FEATURE_1} working
- {IMPLEMENTED_FEATURE_2} operational
- {IMPLEMENTED_FEATURE_3} implemented
- {IMPLEMENTED_FEATURE_4} complete

**Implementation Gaps ({GAP_PERCENTAGE}% to MVP):**
1. {GAP_ITEM_1}
2. {GAP_ITEM_2}
3. {GAP_ITEM_3}
4. {GAP_ITEM_4}
5. {GAP_ITEM_5}

**{TIMELINE} Roadmap:**
- **Phase 1** ({PHASE_1_TIMELINE}): {PHASE_1_FOCUS}
- **Phase 2** ({PHASE_2_TIMELINE}): {PHASE_2_FOCUS}
- **Phase 3** ({PHASE_3_TIMELINE}): {PHASE_3_FOCUS}
- **Phase 4** ({PHASE_4_TIMELINE}): {PHASE_4_FOCUS}
- **Phase 5** ({PHASE_5_TIMELINE}): {PHASE_5_FOCUS}

### 3. Business Model (`{BUSINESS_MODEL_DOC_PATH}` or derived from Strategic Overview)

**{BUSINESS_MODEL_TYPE}:**
- **Tier 1** ({TIER_1_PRICING}): {TIER_1_DESCRIPTION}
- **Tier 2** ({TIER_2_PRICING}): {TIER_2_DESCRIPTION}
- **Tier 3** ({TIER_3_PRICING}): {TIER_3_DESCRIPTION}

**{PRIMARY_USER} Workflow:**
1. {WORKFLOW_STEP_1}
2. {WORKFLOW_STEP_2}
3. {WORKFLOW_STEP_3}
4. {WORKFLOW_STEP_4}
5. {WORKFLOW_STEP_5}
6. {WORKFLOW_STEP_6}
7. {WORKFLOW_STEP_7}

### 4. Technical Architecture (`{TECH_ARCH_DOC_PATH}`)

**Stack Requirements:**
- {FRAMEWORK} ({FRAMEWORK_VERSION})
- {LANGUAGE} ({LANGUAGE_MODE})
- {DATABASE} ({DATABASE_FEATURES})
- {KEY_INTEGRATION_1}
- {KEY_INTEGRATION_2}
- {KEY_INTEGRATION_3}

**Key Architectural Principles:**
- {ARCH_PRINCIPLE_1}
- {ARCH_PRINCIPLE_2}
- {ARCH_PRINCIPLE_3}
- {ARCH_PRINCIPLE_4}

---

## Pre-Implementation Validation Checklist

**Before writing any code, you MUST verify:**

### Strategic Alignment

- [ ] Feature aligns with "{CORE_POSITIONING_1}" positioning
- [ ] Feature supports {CORE_POSITIONING_2}
- [ ] Feature designed for {PRIMARY_USER} users
- [ ] Feature does NOT position {PROJECT_NAME} as {ANTI_POSITIONING_1}
- [ ] Feature does NOT {ANTI_POSITIONING_2}

### Business Model Alignment

- [ ] Feature enhances {PRIMARY_FRAMEWORK_NAME} (if applicable)
- [ ] Feature supports {KEY_CAPABILITY_1}
- [ ] Feature enables {KEY_CAPABILITY_2}
- [ ] Feature tracks metrics for {KEY_METRIC}
- [ ] Feature is NOT {BUSINESS_MODEL_VIOLATION_EXAMPLE}

### Roadmap Alignment

- [ ] Task is part of current phase deliverables
- [ ] All dependencies from previous phases are complete
- [ ] Implementation follows specified workflow mode
- [ ] No future phase features implemented early

### Technical Architecture Alignment

- [ ] Uses {DATABASE} built-in features when applicable
- [ ] Prefers {COMPONENT_TYPE_1} over {COMPONENT_TYPE_2}
- [ ] Uses {PATTERN_1} for {USE_CASE_1}
- [ ] Implements error handling and logging
- [ ] Includes {PERFORMANCE_REQUIREMENT} for {EXTERNAL_SERVICE}

---

## During Implementation Checklist

### Code Quality

- [ ] {LANGUAGE} {LANGUAGE_MODE} compliance
- [ ] No `any` types (use `unknown` or proper types)
- [ ] Non-null assertions only when provably safe
- [ ] Explicit return types for public APIs
- [ ] Zero compilation errors

### Security & {SECURITY_FEATURE} (if applicable)

- [ ] {SECURITY_MECHANISM_1} implemented
- [ ] Data properly isolated by {TENANT_MODEL}
- [ ] {ENCRYPTION_TYPE} encryption for sensitive data
- [ ] No hardcoded credentials
- [ ] Proper authentication checks

### Performance & Cost

- [ ] External API calls rate-limited
- [ ] Cost tracking implemented for {COST_CENTER}
- [ ] Budget enforcement with alerts
- [ ] Efficient database queries
- [ ] Proper caching strategies

---

## Post-Implementation Validation Checklist

### Documentation

- [ ] Commit message cites strategic positioning alignment
- [ ] Commit message references {BUSINESS_MODEL_TYPE} support
- [ ] Commit message documents roadmap phase
- [ ] Feature added to phase completion tracker

### Testing

- [ ] Unit tests passing ({TEST_FRAMEWORK})
- [ ] Integration tests passing (when applicable)
- [ ] E2E tests for critical {PRIMARY_USER} workflows ({E2E_FRAMEWORK})
- [ ] {SPECIAL_VALIDATION_1} validated
- [ ] {SPECIAL_VALIDATION_2} verified

### Compliance Verification

- [ ] No features violating "What {PROJECT_NAME} IS NOT" rules
- [ ] No regressions on strategic positioning
- [ ] Phase deliverable marked complete
- [ ] Next phase dependencies satisfied (if applicable)

---

## Auto-Rejection Triggers

**The following will trigger auto-rollback:**

### ❌ Strategic Positioning Violations

**Treating {PROJECT_NAME} as {ANTI_POSITIONING_1}:**
- {SPECIFIC_ANTI_PATTERN_1}
- {SPECIFIC_ANTI_PATTERN_2}
- {SPECIFIC_ANTI_PATTERN_3}
- {SPECIFIC_ANTI_PATTERN_4}
- {SPECIFIC_ANTI_PATTERN_5}

**{ANTI_POSITIONING_2}:**
- {SPECIFIC_ANTI_PATTERN_6}
- {SPECIFIC_ANTI_PATTERN_7}
- {SPECIFIC_ANTI_PATTERN_8}
- {SPECIFIC_ANTI_PATTERN_9}

**{ANTI_POSITIONING_3}:**
- {SPECIFIC_ANTI_PATTERN_10}
- {SPECIFIC_ANTI_PATTERN_11}
- {SPECIFIC_ANTI_PATTERN_12}
- {SPECIFIC_ANTI_PATTERN_13}

### ❌ Business Model Violations

**Wrong User Focus:**
- Features designed for {WRONG_USER_1} direct use
- UX optimized for {WRONG_USER_2} personas
- {WRONG_PATTERN_1}
- {WRONG_PATTERN_2}

**Wrong Value Proposition:**
- Features that {WRONG_VALUE_1}
- {WRONG_VALUE_2}
- {WRONG_VALUE_3}
- {WRONG_VALUE_4}

### ❌ {PRIMARY_FRAMEWORK_NAME} Violations (if applicable)

**Framework Integrity:**
- {FRAMEWORK_VIOLATION_1}
- {FRAMEWORK_VIOLATION_2}
- {FRAMEWORK_VIOLATION_3}
- {FRAMEWORK_VIOLATION_4}

**Model Deviations:**
- {MODEL_DEVIATION_1}
- {MODEL_DEVIATION_2}
- {MODEL_DEVIATION_3}
- {MODEL_DEVIATION_4}

### ❌ Roadmap Scope Violations

**Phase Discipline:**
- Implementing Phase {N}+ features during Phase {M}
- Building features not in {TIMELINE} roadmap
- Adding "nice-to-have" features before MVP gaps closed
- Refactoring outside current phase scope

**Dependency Violations:**
- Starting Phase {N} work before Phase {M} acceptance criteria met
- Building {DEPENDENT_FEATURE_1} before {PREREQUISITE_FEATURE_1} complete
- Implementing {DEPENDENT_FEATURE_2} before {PREREQUISITE_FEATURE_2} enhanced

---

## Strategic Principles (Quick Reference)

| Principle | Key Requirement | Anti-Pattern |
|-----------|----------------|--------------|
| **{PRINCIPLE_1_NAME}** | {PRINCIPLE_1_REQUIREMENT} | {PRINCIPLE_1_ANTI_PATTERN} |
| **{PRINCIPLE_2_NAME}** | {PRINCIPLE_2_REQUIREMENT} | {PRINCIPLE_2_ANTI_PATTERN} |
| **{PRINCIPLE_3_NAME}** | {PRINCIPLE_3_REQUIREMENT} | {PRINCIPLE_3_ANTI_PATTERN} |
| **{PRINCIPLE_4_NAME}** | {PRINCIPLE_4_REQUIREMENT} | {PRINCIPLE_4_ANTI_PATTERN} |
| **{PRINCIPLE_5_NAME}** | {PRINCIPLE_5_REQUIREMENT} | {PRINCIPLE_5_ANTI_PATTERN} |

---

## {PRIMARY_USER} Workflow (Core User Journey)

**This workflow MUST be supported by all features:**

```
1. {WORKFLOW_STEP_1_DETAIL}
   ↓
2. {WORKFLOW_STEP_2_DETAIL}
   ↓
3. {WORKFLOW_STEP_3_DETAIL}
   ↓
4. {WORKFLOW_STEP_4_DETAIL}
   ↓
5. {WORKFLOW_STEP_5_DETAIL}
   ↓
6. {WORKFLOW_STEP_6_DETAIL}
   ↓
7. {WORKFLOW_STEP_7_DETAIL}
   ↓
8. {WORKFLOW_STEP_8_DETAIL}
   ↓
9. {WORKFLOW_STEP_9_DETAIL}
   ↓
10. {WORKFLOW_STEP_10_DETAIL}
```

**Any feature that disrupts this flow is non-compliant.**

---

## Example: Compliant Commit Message

```
feat(Phase {N}): {FEATURE_DESCRIPTION}

Strategic Alignment:
- {PRINCIPLE_1_NAME}: {HOW_FEATURE_ALIGNS_1}
- {PRINCIPLE_2_NAME}: {HOW_FEATURE_ALIGNS_2}
- {PRINCIPLE_3_NAME}: {HOW_FEATURE_ALIGNS_3}

Business Model Alignment:
- Supports {PRIMARY_USER}-mediated {WORKFLOW_ACTION}
- Enables {KEY_CAPABILITY_1}
- Foundation for {FUTURE_CAPABILITY} (Phase {M})

Roadmap: Phase {N} ({PHASE_TIMELINE}) - {PHASE_FOCUS}
Status: {DELIVERABLE_STATUS}

Technical Implementation:
- {FILE_PATH_1} ({COMPONENT_DESCRIPTION_1})
- {FILE_PATH_2} ({COMPONENT_DESCRIPTION_2})
- {FILE_PATH_3} ({COMPONENT_DESCRIPTION_3})
- {FILE_PATH_4} ({COMPONENT_DESCRIPTION_4})
- {FILE_PATH_5} ({COMPONENT_DESCRIPTION_5})

Testing:
- Unit tests: {TEST_DESCRIPTION}
- Validation: {VALIDATION_DESCRIPTION}
- {SPECIAL_TEST}: {SPECIAL_TEST_DESCRIPTION}

Next Phase Unblocked: Phase {N} Week {W} ({NEXT_DELIVERABLE}) can now begin

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Example: Rejected Commit (Strategic Violation)

```
feat: {VIOLATING_FEATURE_DESCRIPTION}
```

**Rejection Reason:**
- Violates "What {PROJECT_NAME} IS NOT" rule ({ANTI_POSITIONING_1})
- Violates strategic positioning ({CORE_POSITIONING_1})
- Violates business model ({BUSINESS_MODEL_TYPE})
- Not in roadmap ({NO_FEATURE_TYPE} features)

**Required Action:** Rollback and focus on {PRIMARY_USER} workflow features

---

## Quick Reference: What to Build vs What to Reject

### ✅ BUILD (Aligned Features)

**{PRIMARY_USER} Workflow:**
- {ALIGNED_FEATURE_1}
- {ALIGNED_FEATURE_2}
- {ALIGNED_FEATURE_3}
- {ALIGNED_FEATURE_4}
- {ALIGNED_FEATURE_5}
- {ALIGNED_FEATURE_6}
- {ALIGNED_FEATURE_7}

**{PROJECT_TYPE} Platform:**
- {PLATFORM_FEATURE_1}
- {PLATFORM_FEATURE_2}
- {PLATFORM_FEATURE_3}
- {PLATFORM_FEATURE_4}
- {PLATFORM_FEATURE_5}

**{BUSINESS_MODEL_TYPE}:**
- {BUSINESS_FEATURE_1}
- {BUSINESS_FEATURE_2}
- {BUSINESS_FEATURE_3}
- {BUSINESS_FEATURE_4}
- {BUSINESS_FEATURE_5}

### ❌ REJECT (Non-Aligned Features)

**{WRONG_USER_TYPE}-Facing:**
- {REJECT_FEATURE_1}
- {REJECT_FEATURE_2}
- {REJECT_FEATURE_3}
- {REJECT_FEATURE_4}
- {REJECT_FEATURE_5}

**{ANTI_POSITIONING_1}:**
- {REJECT_FEATURE_6}
- {REJECT_FEATURE_7}
- {REJECT_FEATURE_8}
- {REJECT_FEATURE_9}
- {REJECT_FEATURE_10}

**{ANTI_POSITIONING_2}:**
- {REJECT_FEATURE_11}
- {REJECT_FEATURE_12}
- {REJECT_FEATURE_13}
- {REJECT_FEATURE_14}

**{ANTI_POSITIONING_3}:**
- {REJECT_FEATURE_15}
- {REJECT_FEATURE_16}
- {REJECT_FEATURE_17}
- {REJECT_FEATURE_18}

---

## Workflow Mode Guidance

### {FAST_MODE_NAME} ({FAST_MODE_TOKEN_SAVINGS}% token savings)

**Use for:**
- {FAST_MODE_USE_1}
- {FAST_MODE_USE_2}
- {FAST_MODE_USE_3}
- {FAST_MODE_USE_4}
- {FAST_MODE_USE_5}

**Required validation:**
- Self-check against strategic positioning
- No {ANTI_POSITIONING_1} anti-patterns introduced
- {LANGUAGE} compilation passes
- Tests pass

### {NORMAL_MODE_NAME} ({NORMAL_MODE_TOKEN_SAVINGS}% token savings) ⭐ DEFAULT

**Use for:**
- {NORMAL_MODE_USE_1}
- {NORMAL_MODE_USE_2}
- {NORMAL_MODE_USE_3}
- {NORMAL_MODE_USE_4}
- {NORMAL_MODE_USE_5}

**Required validation:**
- Strategic alignment verified
- Business model compliance checked
- Roadmap phase confirmed
- Comprehensive testing
- Security review for {SECURITY_SENSITIVE_FEATURES}

### {CAREFUL_MODE_NAME} (Baseline speed)

**Use for:**
- {CAREFUL_MODE_USE_1}
- {CAREFUL_MODE_USE_2}
- {CAREFUL_MODE_USE_3}
- {CAREFUL_MODE_USE_4}
- {CAREFUL_MODE_USE_5}
- {CAREFUL_MODE_USE_6}

**Required validation:**
- Full compliance review
- Security audit ({SECURITY_CONCERNS})
- Performance testing
- {SPECIAL_VALIDATION_3}
- {PRIMARY_USER} workflow testing

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | {CREATION_DATE} | Initial compliance framework for {PROJECT_NAME} |

---

**Status:** Active Enforcement Document
**Next Review:** After Phase {N} completion ({REVIEW_TIMELINE})
**Feedback:** Report compliance issues to `.agent-os/audit-logs/`
