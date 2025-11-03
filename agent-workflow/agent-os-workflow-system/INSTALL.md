# Installation Guide - Agent-OS Workflow System v2.1.0

## Quick Install (2 minutes)

```bash
cd /path/to/your-project
cp -r /path/to/agent-os-workflow-system/workflows agent-os/
cp -r /path/to/agent-os-workflow-system/roles agent-os/
cp /path/to/agent-os-workflow-system/config.yml.template agent-os/config.yml
```

Done! Now you can use 3-4x faster workflows.

## Verification

```bash
ls agent-os/workflows/
ls agent-os/roles/
cat agent-os/config.yml | grep -A 3 "workflow:"
```

## Next Steps

Prompt Claude Code:
"I've installed Agent-OS Workflow System v2.1.0. Please confirm the setup and explain the three modes available."

See README.md for complete documentation.
