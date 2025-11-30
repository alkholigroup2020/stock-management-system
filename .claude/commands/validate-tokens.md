# Design Token Validator

Scan the codebase for design token violations and provide fixes.

## Scope

**Target:** $ARGUMENTS (if empty, scan `app/pages/`, `app/components/`, and `app/layouts/`)

## Instructions

1. **Read the token definitions:**
   - Read `project-docs/UI_DESIGN_GUIDE.md` for semantic token documentation
   - Read `app/assets/css/main.css` for actual token definitions

2. **Scan for violations** using Grep/Read tools:

### Violation Patterns to Detect

#### 1. Inline Hex Colors (CRITICAL)
```regex
style="[^"]*(?:color|background|border-color):\s*#[0-9a-fA-F]{3,6}
```
**Fix:** Replace with Tailwind class or CSS variable

#### 2. Wrong Nuxt UI Color Props (CRITICAL)
```regex
color="(?:navy|emerald|zinc|amber|red|blue)"
```
**Correct values:** `primary`, `secondary`, `success`, `warning`, `error`, `info`, `neutral`

#### 3. Non-Standard Spacing Values
```regex
(?:p|m|gap|space-[xy])-(?:1|3|5|7|9|10|11)(?:\s|")
```
**Standard spacing:** `2`, `4`, `6`, `8`, `12`, `16`, `20`, `24`
**Exception:** `gap-2`, `gap-3` are allowed for tight inline spacing

#### 4. Direct Palette Colors (instead of semantic)
Look for direct palette usage where semantic tokens should be used:
- `text-navy-*` → should use `text-[var(--ui-text)]` or `text-[var(--ui-primary)]`
- `bg-navy-*` → should use `bg-[var(--ui-bg)]` or semantic class
- `border-navy-*` → should use `border-[var(--ui-border)]`

**Note:** Some direct palette usage is acceptable for decorative elements

#### 5. Hardcoded Pixel Values
```regex
style="[^"]*(?:width|height|padding|margin|font-size):\s*\d+px
```
**Fix:** Use Tailwind utilities or CSS variables

#### 6. Missing Dark Mode Variants
Check for theme-sensitive classes without `dark:` counterpart:
- `bg-white` without `dark:bg-zinc-900`
- `text-zinc-900` without `dark:text-zinc-100`
- `border-zinc-200` without `dark:border-zinc-800`

## Output Format

```
## Token Validation Report

**Files Scanned:** [count]
**Violations Found:** [count]

### Critical Violations (Must Fix)

#### [filename]:[line]
- **Type:** [Inline Hex Color | Wrong Nuxt UI Color | etc.]
- **Found:** `[problematic code]`
- **Fix:** `[corrected code]`
- **Reason:** [why this violates the design system]

### Warnings (Should Fix)

[Less critical issues like non-standard spacing]

### Summary

| Violation Type | Count | Severity |
|----------------|-------|----------|
| Inline Hex Colors | X | Critical |
| Wrong Nuxt UI Colors | X | Critical |
| Non-Standard Spacing | X | Warning |
| Missing Dark Mode | X | Warning |
| Hardcoded Pixels | X | Warning |

### Files with Most Violations
1. [filename] - X violations
2. [filename] - X violations
```

## Critical Rules

- Inline hex colors and wrong Nuxt UI color props are ALWAYS violations
- Reference `project-docs/UI_DESIGN_GUIDE.md` for all token standards
- Provide exact line numbers and suggested fixes
- Do NOT modify any files - this is validation only
- Distinguish between Critical (must fix) and Warning (should fix) issues
