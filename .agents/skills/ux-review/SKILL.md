---
name: ux-review
description: Review and critique web interfaces for UX issues. Use when asked to review, audit, critique, or improve the UX of a website, component, page, or design—especially for Nuxt 4, Nuxt UI, and Tailwind CSS projects. Covers usability heuristics, accessibility (WCAG), visual design, interaction patterns, async feedback states, confirmation dialogs for destructive actions, and responsive behavior. Also use when checking if buttons have loading states or if delete/deactivate actions have confirmations.
---

# UX Review Skill

Review web interfaces for usability, accessibility, and design quality issues.

## Review Workflow

1. **Understand context**: Identify page type, user goals, and device targets
2. **Run heuristic scan**: Apply Nielsen's heuristics (see `references/heuristics.md`)
3. **Check accessibility**: Validate WCAG compliance (see `references/accessibility.md`)
4. **Evaluate visual design**: Assess hierarchy, spacing, consistency (see `references/visual-design.md`)
5. **Review Nuxt UI usage**: Check component patterns (see `references/nuxt-ui-patterns.md`)
6. **Check project design system**: Validate brand colors, layout patterns, component library, Tailwind v4 constraints (see `references/project-design-system.md`)
7. **Audit interactions**: Check async feedback and confirmations (see `references/interaction-patterns.md`)
8. **Prioritize findings**: Rank by severity (Critical → High → Medium → Low)

## Critical Interaction Checks

**Always verify in code** (not just visually):

- [ ] **Destructive actions** (Delete, Deactivate, Remove) have confirmation dialogs
- [ ] **Async operations** show loading state immediately on click
- [ ] **Success feedback** is visible (toast, UI change, or redirect)
- [ ] **Error feedback** explains problem and suggests recovery
- [ ] **Buttons disabled** during pending operations to prevent double-clicks

## Output Format

Structure reviews as:

```
## Summary
[1-2 sentence overall assessment]

## Critical Issues
[Issues that block users or cause significant confusion]

## High Priority
[Issues that hurt usability but have workarounds]

## Medium Priority
[Issues that cause friction but don't block tasks]

## Low Priority / Polish
[Minor improvements and refinements]

## Quick Wins
[Easy fixes with high impact]
```

## Severity Criteria

| Severity | Definition                                                                 | Examples                                                          |
| -------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Critical | Prevents task completion, causes data loss, or major accessibility barrier | Delete without confirmation, no error handling on critical action |
| High     | Significant confusion, requires workaround, or excludes user groups        | No loading state on async action, no success feedback             |
| Medium   | Causes friction, slows users, or violates conventions                      | Inconsistent button styles, poor contrast on secondary text       |
| Low      | Polish issues, minor inconsistencies, subjective improvements              | Spacing tweaks, icon alignment                                    |

## Review Principles

- **Be specific**: Include component names, line numbers, or element selectors
- **Show don't tell**: Provide code fixes, not just descriptions
- **Context matters**: A dashboard differs from a marketing page
- **Prioritize ruthlessly**: 5 actionable issues beat 50 nitpicks
- **Explain why**: Connect issues to user impact
