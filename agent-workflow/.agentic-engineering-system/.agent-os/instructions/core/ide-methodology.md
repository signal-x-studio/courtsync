# Intent-Driven Engineering (IDE) - Methodology

**Purpose:** Sequential, phase-based development with checkpoints for AI-assisted coding

**Status:** Active
**Version:** 1.0.0
**Last Updated:** 2025-10-26

---

## Core Principles

### 1. Sequential Feature Execution
- Work on ONE feature at a time
- Complete all phases before moving to next feature
- Provide checkpoint summaries between features
- Wait for approval before starting next feature

### 2. Phase-Based Development
Each feature follows these phases:
1. **Research** - Analyze existing code, patterns, dependencies
2. **Design** - Plan data models, component structure, APIs
3. **Implement** - Write core functionality
4. **Integrate** - Connect with existing systems
5. **Test** - Verify functionality, check hot-reload
6. **Document** - Add comments, update docs

### 3. Token Optimization
- Limit parallel tool calls (max 5 per response)
- Batch related operations
- Fail fast on errors
- Cache results when safe

### 4. Real-Time Progress Tracking
- Use TodoWrite tool for all multi-step tasks
- Mark tasks in_progress BEFORE starting
- Complete tasks IMMEDIATELY after finishing
- Only ONE task in_progress at a time

---

## When to Use IDE

### Use IDE Sequential Approach

**Triggers:**
- User provides multiple features (3+)
- Numbered list: "1. Add export 2. Create chart 3. Build wizard"
- User says "continue in priority order"
- Roadmap with priorities exists

**Benefits:**
- Avoids 400 tool concurrency errors
- Real-time progress visibility
- Natural stopping points
- Course-correct after each feature

### Don't Use IDE

**Skip for:**
- Single, straightforward tasks
- Quick bug fixes (1-2 files)
- Simple documentation updates
- Running a single command
- Answering questions

---

## Checkpoint Format

### Standard Template

```markdown
## ✅ [Feature Name] Complete

### What Was Accomplished
- ✅ [Key deliverable 1]
- ✅ [Key deliverable 2]
- ✅ [Key deliverable 3]

### Files Created/Modified
- **New:** file1.ts, file2.ts
- **Modified:** file3.ts, file4.ts

### Integration Status
✅ Build successful
✅ Tests passing
✅ No errors

### Metrics
- Lines of code: ~XXX
- Files changed: X
- Tests passing: ✅

---

**Ready for [Next Feature Name]**

Would you like to continue?
```

### When User Says "continue"

1. Acknowledge: "Proceeding with [Feature Name]"
2. Create new todo list for feature
3. Start Phase 1 (Research)
4. Execute systematically

---

## Todo List Standards

### Template for Feature Work

```javascript
[
  {
    content: "Research existing implementation",
    activeForm: "Researching existing code",
    status: "in_progress"
  },
  {
    content: "Design component structure",
    activeForm: "Designing component",
    status: "pending"
  },
  {
    content: "Implement core functionality",
    activeForm: "Implementing core features",
    status: "pending"
  },
  {
    content: "Integrate with existing system",
    activeForm: "Integrating with system",
    status: "pending"
  },
  {
    content: "Test functionality",
    activeForm: "Testing functionality",
    status: "pending"
  },
  {
    content: "Document implementation",
    activeForm: "Documenting implementation",
    status: "pending"
  }
]
```

### Real-Time Update Rules

- ✅ Mark `in_progress` BEFORE starting work
- ✅ Update status immediately upon completion
- ✅ Only ONE task `in_progress` at a time
- ✅ Use descriptive `activeForm` (present continuous tense)
- ❌ Never batch multiple completions
- ❌ Never skip status updates

---

## Tool Usage Limits

### Safe Parallel Limits (Per Response)

| Tool Category | Max Parallel |
|---------------|--------------|
| **Read** | 5 files |
| **Grep** | 3 searches |
| **Glob** | 2 patterns |
| **Bash** (independent) | 3 commands |
| **Edit** (same file) | 1 edit |
| **Write** | 2-3 files |

### Detection Rule

If you're about to make **more than 5 total tool calls** in a single response:
1. **STOP** and reconsider
2. Can this be split into phases?
3. Should some be sequential instead?
4. Is there a simpler approach?

---

## Error Recovery

### If 400 Tool Concurrency Error Occurs

1. Acknowledge the error
2. Analyze what caused it (too many parallel calls)
3. Explain to user what went wrong
4. Restart with sequential approach

### Prevention

IDE methodology **prevents** 400 errors by:
- Sequential feature execution
- Limited parallelism within phases
- One feature in-flight at a time
- Controlled tool usage

---

## Example Workflow

```
User: "Implement features A, B, and C"