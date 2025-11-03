# Claude Code Instructions - AES Project

**Project:** Agentic Engineering System (AES)
**Type:** Framework for AI-assisted development workflows
**Last Updated:** 2025-10-26

---

## Project Overview

This project implements a cost-optimized agentic coding framework that combines:
- **Intent-Driven Engineering (IDE)** - Sequential feature execution with checkpoints
- **Agent OS** - Automated quality gates and validation workflows
- **Claude Code Agents** - Specialized agents for specific tasks

---

## Development Approach

### For Multi-Feature Work

When implementing multiple features:

1. **Follow Intent-Driven Engineering** methodology
2. **Sequential execution** - one feature at a time
3. **Phase-based** - Research → Design → Implement → Integrate → Test → Document
4. **Checkpoints** - pause between features for approval
5. **Todo tracking** - maintain visible progress list

See: `.agent-os/instructions/core/ide-methodology.md`

### For Single Tasks

- Apply fast mode validation (automated only)
- Use specialized agents when appropriate
- Skip checkpoint overhead for simple fixes

---

## Workflow Modes

### Fast Mode (95% of work)
- **Use for:** Most development work
- **Validations:** Lint, type-check, unit tests, build
- **Manual reviews:** None
- **Token budget:** < 1000 tokens

### Careful Mode (5% of work)
- **Use for:** High-risk changes (auth, security, architecture)
- **Validations:** Full suite including integration tests, security scan
- **Manual reviews:** Security, architecture (when triggered)
- **Token budget:** < 5000 tokens

See: `.agent-os/workflows/fast-mode.yml` and `.agent-os/workflows/careful-mode.yml`

---

## Agent Usage

### Available Specialists

Invoke these agents for specific tasks:

1. **coding-standards-reviewer**
   - Trigger: Code review requested
   - Purpose: Standards compliance, best practices
   - Example: "Review this code for standards compliance"

2. **technical-writer**
   - Trigger: Feature complete
   - Purpose: Documentation generation
   - Example: "Document this new feature"

3. **architects-voice-auditor**
   - Trigger: Documentation complete
   - Purpose: Voice and tone compliance
   - Example: "Audit this documentation for voice consistency"

### When to Use Agents

- **Use agents** for specialized, autonomous tasks
- **Use IDE** for sequential multi-feature work
- **Combine both** for complex features requiring specialized review

---

## Quality Gates

### Always Automated
- Code linting (ESLint)
- Type checking (TypeScript)
- Unit tests (Jest)
- Build verification

### Conditional Manual Reviews
- **Security:** Triggered by auth, credentials, database changes
- **Architecture:** Triggered by system design, major refactoring

---

## Todo List Management

### Create todos for:
- Multi-step tasks (3+ steps)
- Complex implementations
- Multi-feature work
- User provides numbered list

### Don't create todos for:
- Single, simple tasks
- Quick fixes
- Informational queries

### Todo Standards
- Mark `in_progress` BEFORE starting
- Complete tasks IMMEDIATELY after finishing
- Only ONE task `in_progress` at a time
- Use descriptive `activeForm` text

---

## Token Optimization

### Parallel Tool Limits
- Read: 5 files max
- Grep: 3 searches max
- Glob: 2 patterns max
- Bash: 3 independent commands max

### If planning > 5 tool calls:
1. STOP and reconsider
2. Split into phases
3. Make some sequential

---

## Checkpoint Protocol

After completing each feature in multi-feature work:

```markdown
## ✅ [Feature Name] Complete

### What Was Accomplished
- ✅ Key deliverables

### Files Changed
- **New:** files
- **Modified:** files

### Status
✅ Build successful
✅ Tests passing

---

**Ready for [Next Feature]**
Would you like to continue?
```

Wait for user approval before starting next feature.

---

## File Structure

```
aes/
├── .agent-os/
│   ├── config.yml              # Main configuration
│   ├── workflows/
│   │   ├── fast-mode.yml       # Fast validation workflow
│   │   └── careful-mode.yml    # Careful validation workflow
│   ├── instructions/
│   │   └── core/
│   │       └── ide-methodology.md
│   └── templates/              # Reusable templates
├── .claude/
│   ├── instructions.md         # This file
│   └── commands/               # Custom slash commands
├── src/                        # Source code
├── tests/                      # Test files
└── docs/                       # Documentation
```

---

## Best Practices

### Code Quality
- Lint and format before committing
- Write tests for new features
- Type all TypeScript code
- Document public APIs

### Token Efficiency
- Use fast mode by default
- Batch related operations
- Cache results when safe
- Fail fast on errors

### Error Handling
- If 400 errors occur, switch to sequential approach
- Analyze root cause
- Update methodology if needed

---

## References

- **IDE Methodology:** `.agent-os/instructions/core/ide-methodology.md`
- **Config:** `.agent-os/config.yml`
- **Fast Mode:** `.agent-os/workflows/fast-mode.yml`
- **Careful Mode:** `.agent-os/workflows/careful-mode.yml`

---

**Focus:** Maximum quality value per token spent. Sequential, efficient, systematic.
