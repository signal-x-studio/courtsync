# AES Quick Reference Card

## 🚀 Fast Commands

```bash
# Start Claude Code
claude

# Run fast validation
/fast

# Run careful validation
/careful

# Create checkpoint
/checkpoint
```

## 📋 Workflow Modes

| Mode | When | Time | Cost | Checks |
|------|------|------|------|--------|
| **Fast** | 95% of work | 5-15 min | <1000 tokens | Automated only |
| **Careful** | 5% high-risk | 30-60 min | <5000 tokens | Full suite + reviews |

## 🔄 IDE Phases

1. **Research** → Analyze existing code
2. **Design** → Plan solution
3. **Implement** → Write code
4. **Integrate** → Connect systems
5. **Test** → Verify functionality
6. **Document** → Add documentation

## ✅ Todo List Rules

```typescript
// BEFORE starting
status: "in_progress"

// AFTER completing
status: "completed"

// ALWAYS
- Only ONE task in_progress
- Complete immediately after finishing
- Use descriptive activeForm
```

## 🛠️ Tool Usage Limits

| Tool | Max Parallel |
|------|--------------|
| Read | 5 files |
| Grep | 3 searches |
| Glob | 2 patterns |
| Bash | 3 commands |
| Edit | 1 per file |
| Write | 2-3 files |

**Rule:** If planning > 5 tool calls → STOP, reconsider, split into phases

## 🎯 When to Use What

### Use Fast Mode
- Routine features
- Bug fixes
- Refactoring
- Documentation

### Use Careful Mode
- Authentication
- Security features
- Architecture changes
- Production deployments

### Use IDE Methodology
- 3+ features
- Complex integrations
- When progress visibility needed
- Multi-day projects

### Use Specialized Agents
- Code review → `coding-standards-reviewer`
- Documentation → `technical-writer`
- Voice audit → `architects-voice-auditor`

## 📊 Success Metrics

### Efficiency
- Token cost: < 1000 per task
- Feedback: < 10 minutes
- False positives: < 5%

### Quality
- Defect detection: > 90%
- Deploy success: > 95%
- Resolution time: < 2 hours

## 🚨 Common Patterns

### Single Feature
```
User: "Add dark mode toggle"
→ Fast mode
→ 6 phases
→ 5-15 minutes
✅ Done
```

### Multiple Features
```
User: "Build: 1) Auth, 2) Profile, 3) Settings"
→ Feature 1 (all phases)
✅ Checkpoint: Continue?
→ Feature 2 (all phases)
✅ Checkpoint: Continue?
→ Feature 3 (all phases)
✅ Complete
```

### High-Risk Change
```
User: "Implement OAuth"
→ Careful mode triggered
→ Full validation + security review
→ 30-60 minutes
✅ Comprehensive verification
```

## ⚠️ Error Prevention

### 400 Concurrency Error
**Cause:** Too many parallel tools
**Fix:** Sequential execution, IDE methodology

### Token Budget Exceeded
**Cause:** Unnecessary validations
**Fix:** Use fast mode, eliminate redundant checks

### Slow Performance
**Cause:** Overusing careful mode
**Fix:** Reserve for high-risk only

## 📁 File Locations

```
.agent-os/
  config.yml              → Main config
  workflows/
    fast-mode.yml         → Fast validation
    careful-mode.yml      → Careful validation
  instructions/
    core/
      ide-methodology.md  → IDE guide
  templates/
    feature-template.md   → Feature workflow
    checkpoint-template.md → Completion summary

.claude/
  instructions.md         → AI instructions
  commands/
    fast.md              → /fast command
    careful.md           → /careful command
    checkpoint.md        → /checkpoint command
```

## 💡 Best Practices

### DO ✅
- Use fast mode by default
- Create todos for 3+ steps
- Mark in_progress before starting
- Complete tasks immediately
- Provide checkpoints
- Limit parallel tools

### DON'T ❌
- Use careful mode unnecessarily
- Exceed tool limits
- Skip checkpoints
- Batch completions
- Todo for simple tasks

## 🎓 Learning Path

1. **Day 1:** Read GETTING_STARTED.md
2. **Day 2:** Try single feature with fast mode
3. **Day 3:** Try multi-feature with IDE
4. **Week 1:** Customize config for your stack
5. **Week 2:** Add custom commands
6. **Month 1:** Measure and optimize

## 📚 Documentation

| File | Purpose |
|------|---------|
| **README.md** | Overview & philosophy |
| **GETTING_STARTED.md** | Detailed guide |
| **PROJECT_SUMMARY.md** | Complete docs |
| **QUICK_REFERENCE.md** | This file |

## 🔗 Key Concepts

**Token Optimization**
→ Automated first, manual when essential
→ Fast for 95%, careful for 5%
→ Batch operations, cache, fail fast

**Sequential Execution**
→ One feature at a time
→ Complete all phases
→ Checkpoints between features

**Phase-Based Development**
→ 6 structured phases
→ Systematic approach
→ Predictable outcomes

**Real-Time Progress**
→ TodoWrite for visibility
→ In_progress before starting
→ Complete immediately after

---

**Quick Start:** `claude` → "implement [feature]" → Follow IDE phases → Checkpoint → Continue

**Version:** 1.0.0 | **Updated:** 2025-10-26
