# Getting Started with AES

## What is AES?

AES (Agentic Engineering System) is a framework that helps you work more efficiently with AI coding assistants like Claude Code. It provides:

- **Structured workflows** for multi-feature development
- **Token optimization** to reduce costs
- **Quality gates** to catch issues early
- **Specialized agents** for specific tasks

## Installation

### Option 1: New Project

```bash
# Create new project directory
mkdir my-project
cd my-project

# Copy AES framework
cp -r path/to/aes/.agent-os .
cp -r path/to/aes/.claude .
cp path/to/aes/.gitignore .

# Initialize git
git init
```

### Option 2: Existing Project

```bash
# In your project root
cp -r path/to/aes/.agent-os .
cp -r path/to/aes/.claude .

# Review and merge with existing .gitignore
cat path/to/aes/.gitignore >> .gitignore
```

## Basic Usage

### 1. Start Claude Code

```bash
claude
```

### 2. For Multi-Feature Work

```
You: "Implement these features:
1. User authentication
2. Profile page
3. Settings dashboard"

Claude: [Creates todo list for Feature 1]
Claude: [Executes Research → Design → Implement → Integrate → Test → Document]

✅ Feature 1 Complete: User Authentication
Ready for Feature 2. Continue?

You: "continue"

Claude: [Starts Feature 2...]
```

### 3. For Single Tasks

```
You: "Fix the login redirect bug"

Claude: [Applies fast mode validation]
Claude: [Implements fix]
Claude: [Verifies with tests]

✅ Bug fixed and verified
```

## Custom Commands

AES includes slash commands for common workflows:

```bash
# Run fast validation (automated only)
/fast

# Run careful validation (full suite)
/careful

# Create checkpoint summary
/checkpoint
```

## Understanding Workflow Modes

### Fast Mode (Default)
**Use for:** 95% of development work

**What it does:**
- Lints code
- Type checks
- Runs unit tests
- Builds project

**Time:** 5-15 minutes
**Cost:** < 1000 tokens

### Careful Mode
**Use for:** High-risk changes (auth, security, architecture)

**What it does:**
- Everything in fast mode
- Integration tests
- Security scan
- Manual reviews (when triggered)

**Time:** 30-60 minutes
**Cost:** < 5000 tokens

## Intent-Driven Engineering (IDE)

IDE is the sequential, phase-based approach used for multi-feature work:

1. **Research** - Understand existing code
2. **Design** - Plan the solution
3. **Implement** - Write the code
4. **Integrate** - Connect to systems
5. **Test** - Verify it works
6. **Document** - Add documentation

**Key benefits:**
- Avoids 400 concurrency errors
- Progress visibility
- Natural stopping points
- Early course correction

## Working with Agents

### Available Agents

**coding-standards-reviewer**
```
You: "Review this code for standards compliance"
Claude: [Launches agent to analyze code quality]
```

**technical-writer**
```
You: "Document this new authentication system"
Claude: [Launches agent to generate comprehensive docs]
```

**architects-voice-auditor**
```
You: "Audit this documentation for voice consistency"
Claude: [Launches agent to check tone and style]
```

### When to Use Agents

- **Use IDE** for sequential multi-feature work
- **Use Agents** for specialized, autonomous tasks
- **Combine both** for complex features needing specialized review

## Configuration

### Project Configuration

Edit `.agent-os/config.yml` to customize:

```yaml
project:
  name: "my-project"
  type: "web-fullstack"  # or api-service, mobile-app, etc.

tech_stack:
  primary: "Node.js/TypeScript"
  testing: "jest"
  lint: "eslint"
```

### Workflow Configuration

Customize validation steps in:
- `.agent-os/workflows/fast-mode.yml`
- `.agent-os/workflows/careful-mode.yml`

### Claude Instructions

Customize AI behavior in:
- `.claude/instructions.md`

## Best Practices

### DO ✅

- Use fast mode for most work
- Create todos for multi-step tasks
- Mark tasks in_progress before starting
- Complete tasks immediately after finishing
- Provide checkpoints between features
- Limit parallel tool calls (max 5)

### DON'T ❌

- Don't use todos for simple tasks
- Don't batch multiple task completions
- Don't exceed parallel tool limits
- Don't skip checkpoints in multi-feature work
- Don't use careful mode unnecessarily

## Troubleshooting

### 400 Tool Concurrency Errors

**Cause:** Too many parallel tool calls

**Solution:**
- Switch to sequential approach
- Use IDE methodology
- Limit to 5 tool calls per response

### Slow Performance

**Cause:** Using careful mode unnecessarily

**Solution:**
- Use fast mode for most work
- Reserve careful mode for high-risk changes

### Token Budget Exceeded

**Cause:** Redundant validations or reviews

**Solution:**
- Review workflow configuration
- Eliminate unnecessary steps
- Use batching for related operations

## Examples

### Example 1: New Feature

```
You: "Add dark mode toggle to settings"

Claude: [Creates todo list]
[Research] ✅ Found theme system
[Design] ✅ Planned toggle component
[Implement] ✅ Created DarkModeToggle.tsx
[Integrate] ✅ Added to SettingsPage
[Test] ✅ All tests passing
[Document] ✅ Updated README

✅ Dark Mode Complete
Files: +2 new, 3 modified
Tests: 5 added, all passing
```

### Example 2: Multiple Features

```
You: "Build user profile: avatar upload, bio editor, privacy settings"

Claude: [Creates todos for avatar upload]
Claude: [Executes all phases]

✅ Avatar Upload Complete
Ready for Bio Editor. Continue?

You: "continue"

Claude: [Creates todos for bio editor]
[... continues ...]
```

### Example 3: Code Review

```
You: "Review my authentication module for standards"

Claude: [Launches coding-standards-reviewer agent]
Claude: [Agent provides comprehensive report]

Found 3 issues:
1. Missing error handling in login.ts:45
2. Inconsistent naming in auth.service.ts
3. Missing TypeScript types in user.model.ts

Shall I apply fixes?

You: "yes"

Claude: [Applies fixes systematically]
✅ All issues resolved
```

## Next Steps

1. **Try it out** - Start with a simple task
2. **Explore templates** - Check `.agent-os/templates/`
3. **Customize** - Adjust workflows to your needs
4. **Share feedback** - Help improve the framework

## Resources

- **README.md** - Overview and philosophy
- **.agent-os/instructions/core/ide-methodology.md** - Detailed IDE explanation
- **.claude/instructions.md** - Claude Code configuration
- **.agent-os/config.yml** - Project configuration

---

**Ready to start?** Try: `claude` then say "implement [your feature]"
