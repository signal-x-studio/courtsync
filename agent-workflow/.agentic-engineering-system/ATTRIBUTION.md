# Attribution & Inspiration

## Original Inspiration

This **Agentic Engineering System (AES)** framework is inspired by and builds upon concepts from:

**[Builder Methods Agent OS](https://github.com/buildermethods/agent-os)**
- Original GitHub Repository
- Created by Builder Methods
- Foundational concepts for agent-based development workflows

## What AES Adds

While inspired by the original agent-os, AES extends and optimizes the framework with:

### 1. Cost Optimization Focus
- Token budget tracking and enforcement
- Fast/careful mode distinction (95/5 split)
- Eliminated redundant validations
- Batch operation support
- Fail-fast strategies

### 2. Intent-Driven Engineering (IDE) Methodology
- Sequential feature execution
- Phase-based development (6 phases)
- Checkpoint protocol between features
- Real-time progress tracking with TodoWrite
- Error prevention (400 concurrency errors)

### 3. Claude Code Integration
- Custom slash commands (/fast, /careful, /checkpoint)
- Specialized agent definitions
- Project-level instructions
- Tool usage limits and guidelines

### 4. Enhanced Templates
- Feature implementation templates
- Checkpoint summary templates
- Structured phase documentation
- Metrics and success criteria

### 5. Parallel Tool Usage Limits
- Defined safe limits per tool type
- Prevention of concurrency errors
- Sequential vs parallel guidelines
- Detection rules for overuse

## Key Differences

| Aspect | Original Agent OS | AES Enhancement |
|--------|------------------|-----------------|
| **Focus** | Multi-agent delegation | Single agent + specialists |
| **Validation** | Extensive reviews | Automated first, selective manual |
| **Token Budget** | Not explicitly tracked | <1000 (fast), <5000 (careful) |
| **Workflow** | Complex multi-agent | Simple fast/careful modes |
| **Error Prevention** | Not addressed | 400 error prevention built-in |
| **Progress Tracking** | Not specified | Real-time TodoWrite integration |
| **Documentation** | General guidelines | Detailed templates and examples |

## Philosophy Alignment

Both frameworks share core principles:
- Quality automation over manual review
- Systematic approach to development
- Clear success criteria
- Measurable outcomes

AES extends these principles with:
- **Maximum quality value per token spent**
- **Sequential execution prevents errors**
- **Real-time visibility into progress**
- **Phase-based predictability**

## Usage Together

AES can complement the original agent-os:
1. Use agent-os concepts for overall project structure
2. Apply AES for day-to-day development workflows
3. Leverage AES templates within agent-os projects
4. Combine multi-agent delegation (agent-os) with IDE methodology (AES)

## Credits

- **Original Agent OS Concept:** [Builder Methods](https://github.com/buildermethods/agent-os)
- **AES Framework:** Developed as cost-optimized enhancement for Claude Code workflows
- **Integration:** Combines agent-os principles with Intent-Driven Engineering methodology

## License

AES maintains the spirit of the original agent-os while adding specific optimizations for Claude Code and token-efficient AI-assisted development.

---

**Repository:** https://github.com/buildermethods/agent-os (original inspiration)
**AES Version:** 1.0.0
**Last Updated:** 2025-10-26
