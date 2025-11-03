# AES - Agentic Engineering System

A cost-optimized framework for AI-assisted software development workflows.

## Overview

AES combines three powerful methodologies for efficient agentic coding:

1. **Intent-Driven Engineering (IDE)** - Sequential feature execution with checkpoints
2. **Agent OS** - Automated quality gates and validation workflows
3. **Claude Code Agents** - Specialized agents for specific tasks

## Quick Start

### Setup

```bash
# Clone or initialize in your project
cd your-project
cp -r path/to/aes/.agent-os .
cp -r path/to/aes/.claude .
```

### Usage

```bash
# Start Claude Code
claude

# For multi-feature work:
# "Implement features A, B, and C"
# Claude will work sequentially with checkpoints

# For single tasks:
# "Fix the authentication bug"
# Claude will use fast mode validation
```

## Core Concepts

### 1. Workflow Modes

#### Fast Mode (95% of work)
- Automated validations only
- No manual reviews
- Token budget: < 1000
- Time: 5-15 minutes

#### Careful Mode (5% of work)
- Full validation suite
- Selective manual reviews
- Token budget: < 5000
- Time: 30-60 minutes

### 2. Intent-Driven Engineering

Sequential, phase-based development:

1. **Research** - Analyze existing code
2. **Design** - Plan structure
3. **Implement** - Write code
4. **Integrate** - Connect systems
5. **Test** - Verify functionality
6. **Document** - Add documentation

Checkpoints between features ensure quality and allow course correction.

### 3. Specialized Agents

- **coding-standards-reviewer** - Code quality and standards
- **technical-writer** - Documentation generation
- **architects-voice-auditor** - Voice and tone compliance

## Directory Structure

```
.agent-os/
├── config.yml              # Main configuration
├── workflows/
│   ├── fast-mode.yml       # Fast validation workflow
│   └── careful-mode.yml    # Careful validation workflow
├── instructions/
│   └── core/
│       └── ide-methodology.md
└── templates/              # Reusable templates

.claude/
├── instructions.md         # Claude Code instructions
└── commands/               # Custom slash commands
```

## Philosophy

**Maximum quality value per token spent.**

- No unnecessary complexity
- Automated first, manual when essential
- Sequential to avoid concurrency errors
- Real-time progress visibility
- Course-correct early and often

## Token Optimization

### Parallel Tool Limits
- Read: 5 files max
- Grep: 3 searches max
- Glob: 2 patterns max
- Bash: 3 commands max

### Prevention of 400 Errors
- Sequential feature execution
- Limited parallelism within phases
- Controlled tool usage
- One feature in-flight at a time

## Metrics

### Efficiency Targets
- Token cost per task: < 1000
- Feedback time: < 10 minutes
- False positive rate: < 5%

### Quality Targets
- Defect detection: > 90%
- Deployment success: > 95%
- Resolution time: < 2 hours

## Example Session

```
User: "Implement user authentication, profile page, and settings"

Claude: [Creates todo list for authentication feature]
Claude: [Executes Research → Design → Implement → Integrate → Test → Document]

✅ Authentication Complete
- Login/logout functionality
- Session management
- Protected routes

Ready for Profile Page. Continue?

User: "continue"

Claude: [Creates todo list for profile page]
Claude: [Executes phases...]
```

## Best Practices

### When to Use IDE
- Multi-feature implementations (3+)
- Complex integrations
- When progress visibility is important

### When to Use Fast Mode
- Single focused tasks
- Quick bug fixes
- Simple updates

### When to Use Careful Mode
- Authentication/security changes
- Architecture modifications
- Production deployments

## References

- **IDE Methodology:** `.agent-os/instructions/core/ide-methodology.md`
- **Claude Instructions:** `.claude/instructions.md`
- **Configuration:** `.agent-os/config.yml`

## Contributing

This framework is designed to evolve based on:
- Real-world usage patterns
- Token optimization discoveries
- New agent capabilities
- Community feedback

## License

MIT

---

**Focus:** Systematic, efficient, and high-quality AI-assisted development.
