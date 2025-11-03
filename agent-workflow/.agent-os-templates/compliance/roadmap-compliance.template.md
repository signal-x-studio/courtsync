# Roadmap & Phase Compliance Instructions

**Version:** 1.0.0
**Date:** {CREATION_DATE}
**Enforcement:** MANDATORY for all development work
**Source:** `{ROADMAP_DOC_PATH}`

## Purpose

This document ensures all development work aligns with the {TOTAL_TIMELINE} implementation roadmap, respects phase dependencies, and updates progress appropriately. Out-of-scope work will trigger auto-rollback.

---

## {TOTAL_TIMELINE} Roadmap Overview

**Goal:** {PROJECT_GOAL}

**Timeline:** {TOTAL_TIMELINE} ({TOTAL_PHASES} phases) to {END_STATE}
**Current Status:** {CURRENT_PHASE_NAME} ({COMPLETION_PERCENTAGE}% {PROJECT_COMPONENT} complete, {GAP_PERCENTAGE}% to {MILESTONE})

### Phase Overview

| Phase | Timeline | Focus | Priority |
|-------|----------|-------|----------|
| **Phase 1** | {PHASE_1_TIMELINE} | {PHASE_1_FOCUS} | {PHASE_1_PRIORITY} |
| **Phase 2** | {PHASE_2_TIMELINE} | {PHASE_2_FOCUS} | {PHASE_2_PRIORITY} |
| **Phase 3** | {PHASE_3_TIMELINE} | {PHASE_3_FOCUS} | {PHASE_3_PRIORITY} |
| **Phase 4** | {PHASE_4_TIMELINE} | {PHASE_4_FOCUS} | {PHASE_4_PRIORITY} |
| **Phase 5** | {PHASE_5_TIMELINE} | {PHASE_5_FOCUS} | {PHASE_5_PRIORITY} |

---

## Phase 1: {PHASE_1_FOCUS} ({PHASE_1_TIMELINE}) [CURRENT]

**Goal:** {PHASE_1_GOAL}

**Status:** {PHASE_1_STATUS}
**Priority:** {PHASE_1_PRIORITY}

### {PHASE_1_SUBPHASE_1_TIMELINE}: {PHASE_1_SUBPHASE_1_NAME}
**Deliverables:**
- [ ] {PHASE_1_DELIVERABLE_1} (`{PHASE_1_DELIVERABLE_1_PATH}`)
- [ ] {PHASE_1_DELIVERABLE_2} ({PHASE_1_DELIVERABLE_2_DESCRIPTION})
- [ ] {PHASE_1_DELIVERABLE_3} ({PHASE_1_DELIVERABLE_3_DESCRIPTION})
- [ ] {PHASE_1_DELIVERABLE_4} ({PHASE_1_DELIVERABLE_4_DESCRIPTION})
- [ ] {PHASE_1_DELIVERABLE_5} ({PHASE_1_DELIVERABLE_5_DESCRIPTION})

**Acceptance Criteria:**
- {PHASE_1_ACCEPTANCE_1}
- {PHASE_1_ACCEPTANCE_2}
- {PHASE_1_ACCEPTANCE_3}
- {PHASE_1_ACCEPTANCE_4}

### {PHASE_1_SUBPHASE_2_TIMELINE}: {PHASE_1_SUBPHASE_2_NAME}
**Deliverables:**
- [ ] {PHASE_1_SUBPHASE_2_DELIVERABLE_1} (`{PHASE_1_SUBPHASE_2_DELIVERABLE_1_PATH}`)
- [ ] {PHASE_1_SUBPHASE_2_DELIVERABLE_2} ({PHASE_1_SUBPHASE_2_DELIVERABLE_2_DESCRIPTION})
- [ ] {PHASE_1_SUBPHASE_2_DELIVERABLE_3} ({PHASE_1_SUBPHASE_2_DELIVERABLE_3_DESCRIPTION})

### {PHASE_1_SUBPHASE_3_TIMELINE}: {PHASE_1_SUBPHASE_3_NAME}
**Deliverables:**
- [ ] {PHASE_1_SUBPHASE_3_DELIVERABLE_1} (`{PHASE_1_SUBPHASE_3_DELIVERABLE_1_PATH}`)
- [ ] {PHASE_1_SUBPHASE_3_DELIVERABLE_2}
- [ ] {PHASE_1_SUBPHASE_3_DELIVERABLE_3}

**Phase 1 Complete When:**
- {PHASE_1_COMPLETION_CRITERIA_1}
- {PHASE_1_COMPLETION_CRITERIA_2}
- {PHASE_1_COMPLETION_CRITERIA_3}
- {PHASE_1_COMPLETION_CRITERIA_4}

---

## Phase 2: {PHASE_2_FOCUS} ({PHASE_2_TIMELINE})

**Goal:** {PHASE_2_GOAL}

**Dependencies:**
- ✅ Phase 1: {PHASE_1_DEPENDENCY_DESCRIPTION}

**Deliverables:**
- {PHASE_2_DELIVERABLE_1}
- {PHASE_2_DELIVERABLE_2}
- {PHASE_2_DELIVERABLE_3}
- {PHASE_2_DELIVERABLE_4}

---

## Phase 3: {PHASE_3_FOCUS} ({PHASE_3_TIMELINE})

**Dependencies:**
- ✅ Phase 2: {PHASE_2_DEPENDENCY_DESCRIPTION}

**Deliverables:**
- {PHASE_3_DELIVERABLE_1}
- {PHASE_3_DELIVERABLE_2}
- {PHASE_3_DELIVERABLE_3}

---

## Phase 4: {PHASE_4_FOCUS} ({PHASE_4_TIMELINE})

**Dependencies:**
- ✅ Phase 1: {PHASE_1_FOR_PHASE_4_DEPENDENCY}
- ✅ Phase 3: {PHASE_3_DEPENDENCY_DESCRIPTION}

**Deliverables:**
- {PHASE_4_DELIVERABLE_1}
- {PHASE_4_DELIVERABLE_2}
- {PHASE_4_DELIVERABLE_3}

---

## Phase 5: {PHASE_5_FOCUS} ({PHASE_5_TIMELINE})

**Dependencies:**
- ✅ All previous phases complete

**Deliverables:**
- {PHASE_5_DELIVERABLE_1}
- {PHASE_5_DELIVERABLE_2}
- {PHASE_5_DELIVERABLE_3}
- {PHASE_5_DELIVERABLE_4}

---

## Pre-Implementation Validation (REQUIRED)

**Before writing ANY code:**

### Scope Verification
- [ ] Task is listed in current phase deliverables
- [ ] Task is NOT listed in future phases
- [ ] Task is NOT out of {TOTAL_TIMELINE} roadmap scope
- [ ] Current phase allows this work

### Dependency Verification
- [ ] All prerequisite phases complete
- [ ] Required services implemented
- [ ] Required types defined
- [ ] Required infrastructure exists

### Workflow Mode Selection
- [ ] {FAST_MODE_NAME} for {FAST_MODE_USE_CASE}
- [ ] {NORMAL_MODE_NAME} for {NORMAL_MODE_USE_CASE} ⭐ DEFAULT
- [ ] {CAREFUL_MODE_NAME} for {CAREFUL_MODE_USE_CASE}

---

## Post-Implementation Validation (REQUIRED)

**After completing deliverable:**

### Completion Verification
- [ ] All deliverable checklist items complete
- [ ] Acceptance criteria met
- [ ] No regressions in previous phases
- [ ] Tests passing

### Roadmap Update
- [ ] Mark deliverable as complete
- [ ] Update phase status
- [ ] Document any deviations
- [ ] Update dependency status for next phase

### Documentation
- [ ] Commit message cites phase
- [ ] Audit log documents deliverable completion
- [ ] Any scope changes documented
- [ ] Next phase unblocked (if applicable)

---

## Auto-Rejection Triggers

### ❌ Phase Scope Violations

**Working on Future Phases:**
- Phase {N} {FUTURE_WORK_EXAMPLE_1} before Phase {M} complete
- Phase {P} {FUTURE_WORK_EXAMPLE_2} before Phase {M} + {N} complete
- Phase {Q} {FUTURE_WORK_EXAMPLE_3} before all phases complete

**Out of Roadmap Scope:**
- Features not in {TOTAL_TIMELINE} plan
- "Nice-to-have" features before {MILESTONE} gaps closed
- {ANTI_POSITIONING_1} features (violates strategic positioning)
- {ANTI_POSITIONING_2} features (violates business model)

### ❌ Dependency Violations

**Starting Work Without Dependencies:**
- Building {DEPENDENT_FEATURE_1} before {PREREQUISITE_FEATURE_1} exists
- {DEPENDENT_FEATURE_2} before {PREREQUISITE_FEATURE_2} enhanced
- {DEPENDENT_FEATURE_3} before {PREREQUISITE_FEATURE_3} complete

### ❌ Workflow Mode Violations

**Using Wrong Mode:**
- Using {FAST_MODE_NAME} for {CAREFUL_MODE_USE_CASE_EXAMPLE} (needs {CAREFUL_MODE_NAME})
- Using {CAREFUL_MODE_NAME} for {FAST_MODE_USE_CASE_EXAMPLE} (wastes tokens)
- Skipping mode selection for complex features

---

## Example: Compliant Commit Message

```
feat(Phase {N}, {SUBPHASE}): {COMMIT_TITLE_EXAMPLE}

Phase: Phase {N} ({PHASE_N_TIMELINE}) - {PHASE_N_FOCUS}
{SUBPHASE_LABEL}: {SUBPHASE} - {SUBPHASE_NAME}
Status: {DELIVERABLE_NAME} complete ({DELIVERABLE_COUNT_CURRENT} of {DELIVERABLE_COUNT_TOTAL})

Deliverable: {DELIVERABLE_DESCRIPTION}
File: {DELIVERABLE_FILE_PATH}

Implementation:
- {IMPLEMENTATION_DETAIL_1}
- {IMPLEMENTATION_DETAIL_2}
- {IMPLEMENTATION_DETAIL_3}
- {IMPLEMENTATION_DETAIL_4}
- {IMPLEMENTATION_DETAIL_5}

Acceptance Criteria Met:
- ✅ {ACCEPTANCE_MET_1}
- ✅ {ACCEPTANCE_MET_2}
- ✅ {ACCEPTANCE_MET_3}
- ✅ {ACCEPTANCE_MET_4}

Dependencies:
- Uses existing {DEPENDENCY_1} (Phase {M} - already built)
- Uses existing {DEPENDENCY_2} (Phase {M} - already built)

Next Steps:
- {SUBPHASE}: Complete {NEXT_DELIVERABLE_1} ({DELIVERABLE_COUNT_NEXT_1} of {DELIVERABLE_COUNT_TOTAL})
- {SUBPHASE}: Complete {NEXT_DELIVERABLE_2} ({DELIVERABLE_COUNT_NEXT_2} of {DELIVERABLE_COUNT_TOTAL})
- {SUBPHASE}: Complete {NEXT_DELIVERABLE_3} ({DELIVERABLE_COUNT_NEXT_3} of {DELIVERABLE_COUNT_TOTAL})
- {SUBPHASE}: Implement {NEXT_DELIVERABLE_4}

Roadmap Status: Phase {N} ~{COMPLETION_PERCENTAGE}% complete

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Example: Rejected Commit (Out of Phase)

```
feat: {FUTURE_PHASE_FEATURE_EXAMPLE}
```

**Rejection Reason:**
- {FUTURE_PHASE_FEATURE_NAME} is Phase {N} ({PHASE_N_TIMELINE})
- Current phase is Phase {M} ({PHASE_M_TIMELINE})
- Dependencies not satisfied (needs Phase {M} + {P} complete)
- Violates roadmap discipline

**Required Action:** Rollback and focus on Phase {M} deliverables

---

## Quick Reference: Current Phase Checklist

### Phase {CURRENT_PHASE_NUMBER}: {CURRENT_PHASE_FOCUS}

**{SUBPHASE_1_LABEL}:**
- [ ] {CURRENT_DELIVERABLE_1}
- [ ] {CURRENT_DELIVERABLE_2}
- [ ] {CURRENT_DELIVERABLE_3}
- [ ] {CURRENT_DELIVERABLE_4}
- [ ] {CURRENT_DELIVERABLE_5}

**{SUBPHASE_2_LABEL}:**
- [ ] {CURRENT_DELIVERABLE_6}
- [ ] {CURRENT_DELIVERABLE_7}
- [ ] {CURRENT_DELIVERABLE_8}

**{SUBPHASE_3_LABEL}:**
- [ ] {CURRENT_DELIVERABLE_9}
- [ ] {CURRENT_DELIVERABLE_10}
- [ ] {CURRENT_DELIVERABLE_11}

**Phase {CURRENT_PHASE_NUMBER} Complete When:**
- {CURRENT_PHASE_COMPLETION_1}
- {CURRENT_PHASE_COMPLETION_2}
- {CURRENT_PHASE_COMPLETION_3}
- {CURRENT_PHASE_COMPLETION_4}

---

## Phase Dependencies Matrix

| Phase | Depends On | Unlocks |
|-------|-----------|---------|
| Phase 1 | {PHASE_1_DEPENDENCY} | Phase {N}, Phase {M} |
| Phase 2 | Phase {N} complete | Phase {P} |
| Phase 3 | Phase {M} complete | Phase {Q} |
| Phase 4 | Phase {N} + Phase {P} | Phase {R} |
| Phase 5 | All phases complete | {PRODUCTION_MILESTONE} |

---

## Workflow Mode by Phase

| Phase | Default Mode | {CAREFUL_MODE_NAME} For |
|-------|--------------|-------------------|
| **Phase 1** | {PHASE_1_DEFAULT_MODE} | {PHASE_1_CAREFUL_USE_CASE} |
| **Phase 2** | {PHASE_2_DEFAULT_MODE} | {PHASE_2_CAREFUL_USE_CASE} |
| **Phase 3** | {PHASE_3_DEFAULT_MODE} | {PHASE_3_CAREFUL_USE_CASE} |
| **Phase 4** | {PHASE_4_DEFAULT_MODE} | {PHASE_4_CAREFUL_USE_CASE} |
| **Phase 5** | {PHASE_5_DEFAULT_MODE} | {PHASE_5_CAREFUL_USE_CASE} |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | {CREATION_DATE} | Initial roadmap compliance for {PROJECT_NAME} |

---

**Status:** Active Enforcement Document
**Source of Truth:** `{ROADMAP_DOC_PATH}`
**Update Frequency:** Check before starting any task
**Feedback:** Report scope violations to `.agent-os/audit-logs/`
