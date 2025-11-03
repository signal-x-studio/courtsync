# Intent-Driven Engineering (IDE) - Workspace Integration

**Purpose:** Integrate IDE methodology with existing Claude Code agent infrastructure across all projects in `~/Workspace`

**Status:** Active
**Version:** 1.0.0
**Last Updated:** 2025-10-11

---

## Quick Start

When a user provides a **multi-feature roadmap** (3+ features) or says **"continue"** after completing work:

1. ✅ **Apply IDE methodology** (see `/Users/nino/Workspace/INTENT_DRIVEN_ENGINEERING.md`)
2. ✅ **Create todo list** with phases for current feature
3. ✅ **Execute sequentially** (one feature at a time)
4. ✅ **Provide checkpoint summary** between features
5. ✅ **Wait for "continue"** before starting next feature

---

## When to Use IDE vs Task Tool Agents

### Use IDE Sequential Approach

**Triggers:**
- User provides numbered list of features: "1. Add export 2. Create org chart 3. Build wizard"
- User says "continue in priority order"
- Roadmap document with priorities exists
- Multi-step implementation (3+ distinct deliverables)

**Benefits:**
- Avoids 400 tool concurrency errors
- User can see progress in real-time
- Natural stopping points between features
- Can course-correct after each feature

**Example:**
```
User: "Implement priorities 10, 9, and 8 from the roadmap"
Assistant: [Creates todos for Priority 10 only]
Assistant: [Completes Priority 10]
Assistant: ✅ Priority 10 Complete: [Summary]
Assistant: Ready for Priority 9. Continue? [CHECKPOINT]
User: "continue"
Assistant: [Creates todos for Priority 9]
...
```

### Use Task Tool (Specialized Agents)

**Triggers:**
- Single complex feature with many sub-tasks
- Specialized analysis (code review, testing, documentation audit)
- Background research that doesn't need real-time updates
- User explicitly requests agent: "use the technical-writer agent"

**Benefits:**
- Agents have specialized knowledge/skills
- Can work autonomously without constant updates
- Handle complex multi-step workflows internally
- Provide comprehensive final report

**Example:**
```
User: "Review all the code for standards compliance"
Assistant: [Launches coding-standards-reviewer agent]
Assistant: [Agent works autonomously]
Assistant: [Agent returns comprehensive report]
```

### Hybrid Approach (Best of Both)

**Pattern:**
1. Use IDE for **feature sequencing** (one priority at a time)
2. Use Task tool for **complex sub-tasks** within each feature
3. Return to IDE for next feature

**Example:**
```
IDE: Working on Priority 8 (Org Chart)
  ├─ Phase 1: Research (IDE handles directly)
  ├─ Phase 2: Design (IDE handles directly)
  ├─ Phase 3: Implement (IDE handles directly)
  ├─ Phase 4: Code Review → [Launch coding-standards-reviewer agent]
  ├─ Phase 5: Documentation → [Launch technical-writer agent]
  └─ CHECKPOINT: Priority 8 complete

IDE: Ready for Priority 7?
```

---

## Integration with Existing Agent Instructions

### For `.claude/instructions.md` (Project-Level)

Add this section to project instructions:

```markdown
## Development Approach

When implementing multiple features:

1. **Follow Intent-Driven Engineering** methodology
2. **Sequential execution** - one feature at a time
3. **Phase-based** - Research → Design → Implement → Integrate → Test → Document
4. **Checkpoints** - pause between features for approval
5. **Todo tracking** - maintain visible progress list

See: `/Users/nino/Workspace/INTENT_DRIVEN_ENGINEERING.md`
```

### For Subagent Instructions

Add checkpoint protocol to each agent's instructions:

**Example - coding-standards-reviewer:**
```markdown
## Execution Protocol

1. Analyze code systematically (one file at a time)
2. Generate comprehensive report
3. **[CHECKPOINT]** Present findings and ask: "Shall I apply fixes?"
4. Wait for approval
5. Apply fixes sequentially (verify after each)
6. Report completion with metrics
```

**Example - technical-writer:**
```markdown
## Documentation Protocol

1. Analyze feature implementation
2. Draft documentation sections
3. **[CHECKPOINT]** Show draft and ask: "Approve for finalization?"
4. Wait for feedback
5. Finalize and commit docs
6. Update traceability mapping
```

---

## Todo List Standards

### Template for Feature Work

```javascript
// Priority X: [Feature Name]
[
  {
    content: "Research existing [X] implementation",
    activeForm: "Researching existing [X]",
    status: "in_progress"
  },
  {
    content: "Design [X] data model/component structure",
    activeForm: "Designing [X]",
    status: "pending"
  },
  {
    content: "Implement [X] core functionality",
    activeForm: "Implementing [X]",
    status: "pending"
  },
  {
    content: "Integrate [X] with [Y]",
    activeForm: "Integrating [X] with [Y]",
    status: "pending"
  },
  {
    content: "Test [X] functionality",
    activeForm: "Testing [X]",
    status: "pending"
  },
  {
    content: "Document [X] implementation",
    activeForm: "Documenting [X]",
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

## Checkpoint Format

### Standard Template

```markdown
## ✅ [Priority X] Complete: [Feature Name]

### What Was Accomplished
- ✅ [Key deliverable 1]
- ✅ [Key deliverable 2]
- ✅ [Key deliverable 3]

### Files Created/Modified
- **New:** [file1], [file2]
- **Modified:** [file3], [file4]

### Integration Status
✅ Hot-reload verified
✅ Dev server running
✅ No errors in console

### Metrics
- Lines of code: ~XXX
- Files changed: X
- Tests passing: ✅

---

**Ready for [Priority Y]: [Next Feature Name]**

Would you like to continue?
```

### When User Says "continue"

1. ✅ Acknowledge: "Proceeding with Priority Y: [Feature Name]"
2. ✅ Create new todo list for next feature
3. ✅ Start Phase 1 (Research)
4. ✅ Continue systematic execution

---

## Hot-Reload Verification

### After Each Integration

```bash
# Check BashOutput for HMR confirmation
BashOutput(bash_id)

# Look for:
✅ "[vite] (client) hmr update /src/components/X.tsx"
❌ Errors, warnings, or missing updates
```

### If Hot-Reload Fails

1. **Stop immediately** (don't continue to next phase)
2. Read error output
3. Fix the issue
4. Verify hot-reload works
5. THEN proceed to next phase

---

## Parallel Tool Call Limits

### Safe Limits (Per Response)

| Tool Category | Max Parallel |
|---------------|--------------|
| **Read** | 5 files |
| **Grep** | 3 searches |
| **Glob** | 2 patterns |
| **Bash** (independent cmds) | 3 commands |
| **Edit** (same file) | 1 edit |
| **Write** | 2-3 files |

### Unsafe (Will Cause 400 Errors)

- ❌ 10+ Read calls simultaneously
- ❌ Multiple Edit calls across different features
- ❌ Launching multiple Task tool agents at once
- ❌ Complex operations mixed with many reads/edits

### Detection Rule

If you're about to make **more than 5 total tool calls** in a single response:
1. **STOP** and reconsider
2. Can this be split into phases?
3. Should some be sequential instead?
4. Is there a simpler approach?

---

## Error Recovery

### If 400 Tool Concurrency Error Occurs

1. **Acknowledge the error**
2. **Analyze what caused it** (too many parallel calls)
3. **Explain to user** what went wrong
4. **Restart with sequential approach**
5. **Update methodology** if new pattern discovered

### Prevention is Key

The IDE methodology **prevents** 400 errors by:
- Sequential feature execution
- Limited parallelism within phases
- One feature in-flight at a time
- Controlled tool usage

---

## Project Templates

### Template 1: New React Component

```markdown
## Priority [X]: [Component Name]

### Phase 1: Research
- [ ] Read similar components for patterns
- [ ] Check type definitions
- [ ] Identify dependencies

### Phase 2: Design
- [ ] Create component interface
- [ ] Design props API
- [ ] Define state management

### Phase 3: Implement
- [ ] Write component file
- [ ] Add styles
- [ ] Implement functionality

### Phase 4: Integrate
- [ ] Import in parent component
- [ ] Update routing (if needed)
- [ ] Wire up state/context

### Phase 5: Test
- [ ] Verify hot-reload
- [ ] Manual testing
- [ ] Check console for errors

### Phase 6: Document
- [ ] Add JSDoc comments
- [ ] Update README
- [ ] Create usage examples

[CHECKPOINT: Component complete]
```

### Template 2: Data Model + View

```markdown
## Priority [X]: [Feature Name]

### Phase 1: Research
- [ ] Analyze existing data structures
- [ ] Review related features
- [ ] Identify integration points

### Phase 2: Design Data Model
- [ ] Create JSON schema
- [ ] Define TypeScript types
- [ ] Design data relationships

### Phase 3: Implement View
- [ ] Create visualization component
- [ ] Add interactivity
- [ ] Implement filtering/search

### Phase 4: Integrate
- [ ] Connect data source
- [ ] Add to navigation
- [ ] Update routes

### Phase 5: Test
- [ ] Verify data loads
- [ ] Test interactions
- [ ] Check hot-reload

### Phase 6: Document
- [ ] Document data schema
- [ ] Add usage guide
- [ ] Update architecture docs

[CHECKPOINT: Feature complete]
```

---

## Metrics & Reporting

### Session Summary Template

```markdown
## 🎯 Session Summary: [Date]

### Approach
- ✅ Intent-Driven Engineering applied
- ✅ Sequential feature execution

### Features Completed
- ✅ Priority X: [Feature A]
- ✅ Priority Y: [Feature B]
- ✅ Priority Z: [Feature C]

### Metrics
- **Features:** 3 completed
- **400 Errors:** 0
- **Checkpoints:** 3 (100% approval)
- **Hot-Reload Success:** 95%
- **Lines of Code:** ~1000
- **Session Duration:** ~60 minutes

### Files Changed
- **Created:** X new files
- **Modified:** Y existing files

### Next Steps
- Priority [N]: [Next Feature]
```

---

## Adoption Checklist

### For New Projects

- [ ] Add `INTENT_DRIVEN_ENGINEERING.md` to project root
- [ ] Create `.agent-os/instructions/core/ide-methodology.md`
- [ ] Update `.claude/instructions.md` with IDE reference
- [ ] Train team on approach

### For Existing Projects

- [ ] Introduce during next multi-feature session
- [ ] Apply retrospectively to understand past 400 errors
- [ ] Update agent instructions to include checkpoints
- [ ] Measure before/after success rates

---

## FAQ

### Q: When should I NOT use IDE?

**A:** For single, focused tasks like:
- Quick bug fixes (1-2 files)
- Simple documentation updates
- Running a single command
- Answering questions

### Q: Can IDE work with existing agents?

**A:** Yes! IDE handles **feature sequencing**, agents handle **complex sub-tasks**. They complement each other.

### Q: What if user wants faster execution?

**A:** IDE is already fast (3 major features in 60 min). The checkpoints add ~30 seconds but prevent hours of debugging 400 errors.

### Q: Should every project use IDE?

**A:** Use IDE for:
- Multi-feature implementations
- Complex integrations
- When user wants visibility

Don't use IDE for:
- Single-task operations
- Quick fixes
- Simple queries

---

## References

- **Full Methodology:** `/Users/nino/Workspace/INTENT_DRIVEN_ENGINEERING.md`
- **Example Session:** Commerce Transformation Navigator (2025-10-11)
  - 3 features (Priority 10, 9, 8)
  - 0 tool concurrency errors
  - ~1000 lines of code
  - 100% checkpoint approval rate

---

**Last Updated:** 2025-10-11
**Maintainer:** Nino Chavez
**Status:** Active across all ~/Workspace projects
