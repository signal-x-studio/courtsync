# Compliance Framework Setup Guide

**Version:** 1.0.0
**Time Required:** 30 minutes (simple) to 4 hours (complex)
**Prerequisites:** Project with `.agent-os/` directory

---

## Step-by-Step Setup

### Phase 1: Copy Templates (5 min)

```bash
# Navigate to your project root
cd /path/to/your/project

# Create compliance directory
mkdir -p .agent-os/instructions/compliance

# Copy templates
cp ~/Workspace/.agent-os-templates/compliance/*.template.* .agent-os/instructions/compliance/

# Remove .template from filenames
cd .agent-os/instructions/compliance
for file in *.template.*; do
  mv "$file" "${file/.template/}"
done

# Back to project root
cd ../../..
```

---

### Phase 2: Gather Project Information (10-30 min)

**Before editing templates, collect this information:**

#### Strategic Information

- [ ] **Project Name:** _________________
- [ ] **Project Type:** (web-app | mobile-app | api | library | internal-tool | saas-product)
- [ ] **Business Model:** (saas-subscription | service-delivery | internal-platform | open-source)
- [ ] **Primary User:** (end-customer | internal-team | developer | consultant)
- [ ] **Core Value Proposition:** ___________________________________

#### Strategic Documents

- [ ] **Mission/Vision Document:** `docs/______.md`
- [ ] **PRD/Requirements:** `docs/______.md`
- [ ] **Roadmap:** `docs/______.md`
- [ ] **Design System:** `docs/______.md` or `tailwind.config.ts`

#### Technical Information

- [ ] **Framework:** (Next.js | SvelteKit | React | Vue | etc.)
- [ ] **Language:** (TypeScript | JavaScript | Python | Go | etc.)
- [ ] **Design System:** (shadcn/ui | custom | Tailwind | Material-UI | etc.)
- [ ] **Component Library:** `components/ui/` or `src/components/`

#### Roadmap Information (if phased project)

- [ ] **Current Phase:** Phase ___ (Weeks ___-___)
- [ ] **Total Phases:** ___
- [ ] **Timeline:** ___ weeks total
- [ ] **Phase Names:** Phase 1: ______, Phase 2: ______, etc.

---

### Phase 3: Customize mission-alignment.md (15-60 min)

**File:** `.agent-os/instructions/compliance/mission-alignment.md`

#### Find and Replace Placeholders

```bash
# Use your editor's find/replace (Cmd+Shift+F in VS Code)

{PROJECT_NAME}            → Your Actual Project Name
{PROJECT_TYPE}            → web-app | api | library | etc.
{BUSINESS_MODEL}          → SaaS product | Service delivery | etc.
{PRIMARY_USER}            → Who uses this product
{CORE_VALUE_PROPOSITION}  → What problem does this solve
{STRATEGIC_DOC_PATH}      → Path to your mission/vision doc
{PRD_PATH}                → Path to your PRD
```

#### Add Project-Specific Principles

**Find section:** "Core Principles (PROJECT-SPECIFIC)"

**Replace with your actual principles:**

Example for Internal Platform:
```markdown
### Core Principles

1. **Internal Platform (NOT Client-Facing)**
   - Built for internal team use only
   - No public signup or marketing
   - Expert-mediated, not self-service

2. **Service Generation (NOT Product Sales)**
   - Creates service opportunities
   - Revenue from delivery, not subscriptions
   - Platform enables consultants

3. **Score Framework (0-100 with Dimensions)**
   - Single numeric score for clarity
   - Weighted dimensions
   - Competitive benchmarking
```

#### Add Anti-Patterns (Auto-Rejection Triggers)

**Find section:** "Auto-Rejection Triggers"

**Add your project-specific anti-patterns:**

```markdown
### ❌ Strategic Positioning Violations

**Specific to your project:**
- Feature X that violates principle Y
- UI pattern that contradicts positioning
- Business model anti-pattern
```

---

### Phase 4: Customize design-system.md (15-60 min)

**File:** `.agent-os/instructions/compliance/design-system.md`

#### Skip This Step If:
- Pure backend API (no UI)
- CLI tool
- Data pipeline

#### Find and Replace

```bash
{DESIGN_SYSTEM_SOURCE}    → tailwind.config.ts | design-tokens.json | etc.
{COMPONENT_LIBRARY}       → shadcn/ui | custom | Material-UI | etc.
{PRIMARY_BRAND_COLOR}     → #5B7CFF or brand-500
{TYPOGRAPHY_SYSTEM}       → Inter | Roboto | System fonts
{ICON_LIBRARY}            → Lucide | Heroicons | Font Awesome
```

#### Update Color Palette

**Find section:** "Color System"

**Replace with your actual colors:**

```markdown
### Brand Colors

```css
brand-500: #YOUR_PRIMARY_COLOR
brand-600: #YOUR_HOVER_COLOR
brand-700: #YOUR_ACTIVE_COLOR
```

### Semantic Colors (if using)

```css
semantic-success: #YOUR_SUCCESS_COLOR
semantic-warning: #YOUR_WARNING_COLOR
semantic-error: #YOUR_ERROR_COLOR
```
```

#### Update Component Patterns

**If using shadcn/ui:**
- Keep component examples as-is
- Update import paths if different

**If using custom components:**
- Replace with your actual component patterns
- Document required props and usage

**If no component library:**
- Remove component sections
- Focus on color/typography/spacing only

---

### Phase 5: Customize roadmap-compliance.md (30-90 min)

**File:** `.agent-os/instructions/compliance/roadmap-compliance.md`

#### Skip This Step If:
- Single sprint feature
- Maintenance work
- No clear phases

#### Find and Replace

```bash
{TOTAL_TIMELINE}         → 16 weeks | 3 months | etc.
{TOTAL_PHASES}           → 5 | 3 | 4 | etc.
{CURRENT_PHASE}          → Phase 1 | MVP | Alpha | etc.
{CURRENT_PHASE_TIMELINE} → Weeks 1-4 | Month 1 | etc.
```

#### Define Phase Structure

**Find section:** "Phase Overview"

**Replace with your actual phases:**

```markdown
| Phase | Timeline | Focus | Priority |
|-------|----------|-------|----------|
| **Phase 1** | Weeks 1-4 | MVP Core Features | ⭐⭐⭐ CRITICAL |
| **Phase 2** | Weeks 5-8 | Enhanced Features | ⭐⭐ HIGH |
| **Phase 3** | Weeks 9-12 | Polish & Performance | ⭐ MEDIUM |
```

#### Document Phase Dependencies

**Find section:** "Phase Dependencies Matrix"

**Update with your dependencies:**

```markdown
| Phase | Depends On | Unlocks |
|-------|-----------|---------|
| Phase 1 | None | Phase 2, Phase 3 |
| Phase 2 | Phase 1 complete | Phase 4 |
| Phase 3 | Phase 1 complete | Phase 4 |
| Phase 4 | Phase 2 + Phase 3 | Production launch |
```

---

### Phase 6: Integrate with config.yml (10 min)

**File:** `.agent-os/config.yml`

#### Add Compliance Section

```bash
# Find the quality gates section in your config.yml
# Add compliance checks to pre_flight and post_flight

# Or append the compliance section from template:
cat .agent-os/instructions/compliance/compliance-config.yml >> .agent-os/config.yml
```

#### Update with Your Paths

```yaml
compliance:
  enabled: true

  strategic_positioning:
    document: "docs/strategy/YOUR_MISSION_DOC.md"  # Update this
    instructions: ".agent-os/instructions/compliance/mission-alignment.md"

  design_system:
    source: "tailwind.config.ts"  # Or your design token file
    instructions: ".agent-os/instructions/compliance/design-system.md"

  roadmap_alignment:
    document: "docs/YOUR_ROADMAP.md"  # Update this
    instructions: ".agent-os/instructions/compliance/roadmap-compliance.md"
    current_phase:
      name: "YOUR CURRENT PHASE"  # Update this
      status: "IN PROGRESS"
```

---

### Phase 7: Update CLAUDE.md (15 min)

**File:** `CLAUDE.md`

#### Add Compliance Section

**Insert after "Agent Operating System" section:**

```markdown
## Compliance Framework (MANDATORY)

**Version:** 1.0.0
**Status:** ENFORCED - All work must comply

[Copy content from compliance-claude.md template]
```

#### Update Paths

```markdown
**Strategic Documents:**
1. **Mission/Vision** (`docs/YOUR_PATH.md`)  # Update
2. **Requirements** (`docs/YOUR_PATH.md`)     # Update
3. **Roadmap** (`docs/YOUR_PATH.md`)          # Update

**Technical Standards:**
4. **Design System** (`YOUR_SOURCE`)           # Update
```

---

### Phase 8: Validation (10 min)

#### Checklist

- [ ] All `{PLACEHOLDER}` markers replaced
- [ ] Strategic documents referenced correctly
- [ ] Design system paths accurate
- [ ] Roadmap phases documented
- [ ] config.yml compliance section added
- [ ] CLAUDE.md compliance section added
- [ ] Auto-rejection triggers project-specific
- [ ] Commit message example updated

#### Test

```bash
# Check for remaining placeholders
grep -r "{" .agent-os/instructions/compliance/

# Should return no results (or only in comments/examples)
```

---

## Common Scenarios

### Scenario 1: Simple Web App (30 min setup)

**Project:** Simple CRUD app, single sprint, clear design system

**Steps:**
1. Copy templates
2. mission-alignment.md: Replace placeholders, add 2-3 core principles
3. design-system.md: Update colors and typography
4. Skip roadmap-compliance.md (single sprint)
5. Add to config.yml and CLAUDE.md
6. Done

**Result:** Basic compliance framework preventing strategic drift

---

### Scenario 2: Internal Platform (1-2 hours setup)

**Project:** Internal consulting tool, phased implementation, strict positioning

**Steps:**
1. Copy templates
2. mission-alignment.md: Full customization with internal vs SaaS distinction
3. design-system.md: Component library documentation
4. roadmap-compliance.md: 3-5 phases with dependencies
5. Add specific anti-patterns (client-facing features, SaaS patterns)
6. config.yml and CLAUDE.md integration
7. Done

**Result:** Comprehensive compliance preventing business model violations

---

### Scenario 3: Consumer SaaS Product (2-4 hours setup)

**Project:** B2C SaaS, complex roadmap, custom design system

**Steps:**
1. Copy templates
2. mission-alignment.md: B2C positioning, subscription model, user journeys
3. design-system.md: Complete component library, accessibility standards
4. roadmap-compliance.md: Multi-phase with MVP → Growth → Scale
5. Custom compliance docs (monetization, growth metrics)
6. Detailed auto-rejection triggers
7. config.yml and CLAUDE.md integration
8. Done

**Result:** Full compliance framework with growth stage protection

---

## Troubleshooting

### "Too many placeholders, overwhelming"

**Solution:** Start minimal
1. Replace only required placeholders (PROJECT_NAME, paths)
2. Use template examples as-is initially
3. Customize incrementally as patterns emerge

### "Not sure what anti-patterns to add"

**Solution:** Start with template examples
1. Use anti-patterns from similar project type
2. Add specific ones as violations discovered
3. Review after first sprint, add learnings

### "Design system not documented"

**Solution:** Document as you go
1. Start with color palette and typography
2. Add component patterns as you build them
3. Update compliance doc when patterns solidify

---

## Next Steps

After setup:

1. **Commit compliance framework:**
   ```bash
   git add .agent-os/instructions/compliance/
   git commit -m "feat: Add compliance framework for strategic alignment"
   ```

2. **Test with first feature:**
   - Build a small feature
   - Verify compliance checks work
   - Refine triggers if too strict/loose

3. **Team alignment:**
   - Share strategic documents
   - Explain auto-rejection triggers
   - Document learnings

4. **Iterate:**
   - Update as project evolves
   - Add new anti-patterns
   - Refine validation checklists

---

## Getting Help

**Common Issues:**
- See `README.md` Troubleshooting section
- Check example projects in `~/Workspace/02-local-dev/`
- Review template comments for guidance

**Template Updates:**
- Templates versioned in `~/Workspace/.agent-os-templates/compliance/`
- Check for updates periodically
- Submit improvements back to templates

---

**Time Investment vs Value:**
- 30 min setup → Prevents days of rework from strategic drift
- 2 hours setup → Comprehensive protection for complex projects
- Compliance framework pays for itself in first prevented violation
