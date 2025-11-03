# Intent-Driven Engineering (IDE) Methodology

**Version:** 1.0.0
**Created:** 2025-10-11
**Purpose:** Codified approach for AI-human collaborative development that avoids tool concurrency issues while maximizing throughput

---

## Core Principles

### 1. Sequential Feature Execution
**Rule:** Execute one feature at a time through its complete lifecycle before starting the next.

**Rationale:** Prevents tool concurrency explosions (400 errors) by ensuring focused, controlled progression.

**Implementation:**
```
Feature A: Research → Design → Implement → Integrate → Test → Document
[CHECKPOINT: Human approval to continue]
Feature B: Research → Design → Implement → Integrate → Test → Document
[CHECKPOINT: Human approval to continue]
Feature C: ...
```

### 2. Phase-Based Task Decomposition
**Rule:** Break each feature into 6-8 distinct phases with clear deliverables.

**Standard Phases:**
1. **Research** - Understand existing codebase, dependencies, patterns
2. **Design** - Create data models, component structure, API contracts
3. **Implement** - Write core functionality
4. **Integrate** - Connect to existing systems
5. **Test** - Validate functionality (manual or automated)
6. **Document** - Update docs, add comments, create examples

**Tool Usage per Phase:**
- Research: Read (3-5 files), Grep (2-3 searches), Glob (1-2 patterns)
- Design: Write (data files), Read (reference files)
- Implement: Write (new components), Edit (modifications)
- Integrate: Edit (existing files), Read (integration points)
- Test: Bash (dev server checks), BashOutput (verify)
- Document: Write/Edit (docs)

### 3. Controlled Parallelism
**Rule:** Only parallelize within a single phase, never across phases or features.

**Safe Parallelism:**
✅ Reading 3-5 files simultaneously during Research phase
✅ Grepping multiple patterns during discovery
✅ Installing multiple dependencies in one command

**Unsafe Parallelism:**
❌ Implementing Feature A while testing Feature B
❌ Editing 10+ files across different features
❌ Running multiple complex agents concurrently

### 4. Todo-Driven Progress Tracking
**Rule:** Maintain a visible todo list that reflects current phase and provides checkpoints.

**Todo Structure:**
```javascript
[
  { content: "Research X", activeForm: "Researching X", status: "completed" },
  { content: "Design Y data model", activeForm: "Designing Y", status: "completed" },
  { content: "Implement Z component", activeForm: "Implementing Z", status: "in_progress" },
  { content: "Integrate with W", activeForm: "Integrating with W", status: "pending" },
  { content: "Test functionality", activeForm: "Testing functionality", status: "pending" },
  { content: "Document changes", activeForm: "Documenting changes", status: "pending" }
]
```

**Benefits:**
- Human can see progress at a glance
- Clear indication of what's happening now
- Natural stopping points for "continue" checkpoints
- Evidence of systematic approach

### 5. Hot-Reload Verification
**Rule:** After each integration, verify hot-reload works before proceeding.

**Implementation:**
1. Make code changes
2. Check `BashOutput` for HMR update confirmation
3. Only proceed if hot-reload successful
4. If errors, fix immediately before continuing

### 6. Human Approval Gates
**Rule:** Pause for explicit "continue" signal between major features.

**Gate Locations:**
- After completing each priority item
- Before starting new major feature
- When encountering architectural decisions
- When shifting between different areas of codebase

**Format:**
```markdown
## ✅ Priority X Complete: [Feature Name]

[Detailed summary of what was accomplished]

**Ready for Priority Y: [Next Feature]**

Would you like to continue?
```

---

## Workflow Templates

### Template 1: New Feature Implementation

```markdown
## Phase 0: Planning
- [ ] Create todo list with 6-8 phases
- [ ] Identify dependencies and blockers
- [ ] Estimate complexity (simple/moderate/complex)

## Phase 1: Research (Sequential, limited parallelism)
- [ ] Read relevant existing files (max 5 in parallel)
- [ ] Search for patterns (max 3 greps in parallel)
- [ ] Identify integration points
- [ ] Document findings

[CHECKPOINT: Research complete, proceeding to Design]

## Phase 2: Design
- [ ] Create data models/schemas
- [ ] Design component structure
- [ ] Define API contracts/interfaces
- [ ] Create type definitions

[CHECKPOINT: Design approved, proceeding to Implementation]

## Phase 3: Implement
- [ ] Write core component (single file focus)
- [ ] Add supporting utilities (if needed)
- [ ] Create data files (if needed)
- [ ] Mark implementation complete

[CHECKPOINT: Implementation complete, proceeding to Integration]

## Phase 4: Integrate
- [ ] Update main application file
- [ ] Add routing/navigation (if needed)
- [ ] Update type definitions
- [ ] Connect to existing state/context

[CHECKPOINT: Integration complete, verifying hot-reload]

## Phase 5: Test
- [ ] Check BashOutput for successful HMR
- [ ] Verify dev server still running
- [ ] Document any errors and fix
- [ ] Mark tests passing

[CHECKPOINT: Tests passing, proceeding to Documentation]

## Phase 6: Document
- [ ] Update README (if needed)
- [ ] Add inline comments
- [ ] Create usage examples
- [ ] Mark feature complete

[FINAL CHECKPOINT: Feature complete, ready for next priority]
```

### Template 2: Bug Fix

```markdown
## Phase 1: Reproduce & Diagnose
- [ ] Identify symptoms
- [ ] Read affected files
- [ ] Trace execution path
- [ ] Identify root cause

## Phase 2: Fix & Test
- [ ] Implement fix (minimal change)
- [ ] Verify hot-reload
- [ ] Test fix works
- [ ] Document what was changed

[CHECKPOINT: Bug fixed]
```

### Template 3: Refactoring

```markdown
## Phase 1: Analyze Current State
- [ ] Read files to be refactored
- [ ] Document current structure
- [ ] Identify pain points
- [ ] Design improved structure

## Phase 2: Refactor (One file at a time)
- [ ] Refactor file 1
- [ ] Verify hot-reload
- [ ] Refactor file 2
- [ ] Verify hot-reload
- [ ] Continue sequentially

## Phase 3: Verify & Document
- [ ] Run tests
- [ ] Update documentation
- [ ] Mark refactoring complete

[CHECKPOINT: Refactoring complete]
```

---

## Anti-Patterns to Avoid

### 1. ❌ Aggressive Parallelization
```markdown
BAD:
- Launching 5 agents simultaneously
- Editing 15 files across 3 features
- Running multiple complex build processes
```

**Why it fails:** Tool concurrency limits (400 errors)

**Fix:** Sequential execution with limited parallelism

### 2. ❌ Skipping Checkpoints
```markdown
BAD:
- Implementing Features A, B, C without stopping
- No todo list updates
- No human approval between features
```

**Why it fails:** User loses visibility, can't course-correct

**Fix:** Explicit checkpoints with summaries

### 3. ❌ Batching Todo Updates
```markdown
BAD:
- Mark 5 todos complete at end
- No in_progress updates
- No activeForm descriptions
```

**Why it fails:** User doesn't see progress

**Fix:** Real-time todo updates as work happens

### 4. ❌ Working Without Dev Server Verification
```markdown
BAD:
- Make 10 changes
- Never check BashOutput
- Assume everything works
```

**Why it fails:** Errors compound, hard to debug

**Fix:** Check hot-reload after each integration

### 5. ❌ Ignoring User Context Switches
```markdown
BAD:
- User opens new file (hint about interest)
- Continue with original plan anyway
```

**Why it fails:** Misses user intent signals

**Fix:** Adapt based on user actions

---

## Integration with Existing Agent Systems

### For ~/Workspace Projects

**Add to `.agent-os/instructions/core/methodology.md`:**

```markdown
# Intent-Driven Engineering Integration

When executing multi-feature implementations:

1. **Use IDE methodology** for sequential feature execution
2. **Preserve existing agent protocols** for specialized tasks
3. **Add checkpoints** between major features
4. **Maintain todo lists** for visibility
5. **Verify hot-reload** after integrations

## When to Use IDE vs Task Tool Agents

**Use IDE (sequential):**
- Multi-feature roadmaps (3+ features)
- Complex integrations across codebase
- When user wants to see progress step-by-step

**Use Task Tool (agents):**
- Single complex feature with many steps
- Specialized tasks (code review, testing, documentation)
- Background research or analysis
- When user wants hands-off execution

**Combine Both:**
- IDE for feature sequencing
- Task tool for complex sub-tasks within each feature
```

### Subagent Enhancement

**Add to specialized agents (e.g., `coding-standards-reviewer`):**

```markdown
## Checkpoint Protocol

After completing review:
1. Update todo list to mark review complete
2. Provide summary of findings
3. Ask: "Shall I proceed with applying fixes?" [CHECKPOINT]
4. Wait for user approval
5. Apply fixes sequentially (one file at a time)
6. Verify after each fix
```

---

## Metrics for Success

### Session-Level Metrics
- **Features Completed:** Count of priorities finished
- **Errors Encountered:** 400 errors = methodology violation
- **Checkpoint Effectiveness:** User corrections after checkpoints
- **Hot-Reload Success Rate:** % of integrations that worked first try

### Example: This Session
```
✅ Features Completed: 3 (Priority 10, 9, 8)
✅ 400 Errors: 0
✅ Checkpoint Effectiveness: 100% (3/3 approvals)
✅ Hot-Reload Success: ~95% (1 bug caught and fixed)
✅ Lines of Code: ~1000+
✅ Session Duration: ~60 minutes of focused work
```

---

## Quick Reference Card

### The IDE Approach in 5 Steps

1. **Break into Features** - One priority at a time
2. **Phase Each Feature** - Research → Design → Implement → Integrate → Test → Doc
3. **Update Todos Real-Time** - Keep user informed
4. **Verify After Integration** - Check hot-reload works
5. **Checkpoint Between Features** - Get approval to continue

### Red Flags (Stop and Reassess)

🚩 More than 5 parallel tool calls
🚩 Working on 2+ features simultaneously
🚩 Todo list not updated for 3+ actions
🚩 Haven't checked BashOutput in 5+ changes
🚩 User said "continue" but no checkpoint was provided

---

## Adoption Guide

### For New Projects

1. Add `INTENT_DRIVEN_ENGINEERING.md` to project root
2. Create `.agent-os/instructions/core/ide-methodology.md`
3. Update agent instructions to reference IDE
4. Use template workflows for features

### For Existing Projects

1. Introduce during next major feature work
2. Apply retrospectively to understand past issues
3. Train team/agents on methodology
4. Measure before/after metrics

### For AI Assistants

1. Read this methodology at session start
2. Apply templates to user requests
3. Create todo lists proactively
4. Pause for checkpoints
5. Report metrics at session end

---

## Conclusion

**Intent-Driven Engineering** is a lightweight, pragmatic approach that:
- ✅ Prevents tool concurrency issues
- ✅ Maintains user visibility and control
- ✅ Enables rapid, systematic development
- ✅ Works alongside existing agent systems
- ✅ Scales from single features to full roadmaps

**Core Philosophy:** *Sequential features, phased execution, continuous verification, human checkpoints.*

---

**License:** MIT
**Maintainer:** Nino Chavez
**Last Updated:** 2025-10-11
