---
name: ux-review
description: Review and critique web interfaces for UX issues. Use when asked to review, audit, critique, or improve the UX of a website, component, page, or design—especially for Nuxt 4, Nuxt UI, and Tailwind CSS projects. Covers usability heuristics, accessibility (WCAG), visual design, interaction patterns, and responsive behavior.
---

# UX Review Skill

Review web interfaces for usability, accessibility, and design quality issues.

## Review Workflow

1. **Understand context**: Identify page type, user goals, and device targets
2. **Run heuristic scan**: Apply Nielsen's heuristics (see `references/heuristics.md`)
3. **Check accessibility**: Validate WCAG compliance (see `references/accessibility.md`)
4. **Evaluate visual design**: Assess hierarchy, spacing, consistency (see `references/visual-design.md`)
5. **Review Nuxt UI usage**: Check component patterns (see `references/nuxt-ui-patterns.md`)
6. **Prioritize findings**: Rank by severity (Critical → High → Medium → Low)

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

| Severity | Definition |
|----------|------------|
| Critical | Prevents task completion, causes data loss, or major accessibility barrier |
| High | Significant confusion, requires workaround, or excludes user groups |
| Medium | Causes friction, slows users, or violates conventions |
| Low | Polish issues, minor inconsistencies, subjective improvements |

## Review Principles

- **Be specific**: Include component names, line numbers, or element selectors
- **Show don't tell**: Provide code fixes, not just descriptions
- **Context matters**: A dashboard differs from a marketing page
- **Prioritize ruthlessly**: 5 actionable issues beat 50 nitpicks
- **Explain why**: Connect issues to user impact
