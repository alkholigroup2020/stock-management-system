# Accessibility Audit (Live Browser Testing)

Perform a comprehensive WCAG 2.1 AA accessibility audit using Playwright browser automation.

## Scope

**Target:** $ARGUMENTS (if empty, audit main application routes)

Parse arguments:
- If a route is provided (e.g., `/deliveries`), audit that specific page
- If empty, audit the following main routes:
  - `/` (Dashboard)
  - `/stock-now`
  - `/items`
  - `/deliveries`
  - `/issues`
  - `/transfers`
  - `/login`

## Prerequisites

Ensure the dev server is running at `http://localhost:3000`

## Instructions

### 1. Start Browser Session

Use Playwright MCP to navigate to the target page:

```
mcp__playwright__browser_navigate({ url: "http://localhost:3000[route]" })
```

### 2. Take Accessibility Snapshot

```
mcp__playwright__browser_snapshot()
```

### 3. Run Accessibility Checks

For each page, perform these checks:

#### Color Contrast (WCAG 2.1 AA)
- **Normal text:** Minimum 4.5:1 contrast ratio
- **Large text (18px+ or 14px+ bold):** Minimum 3:1 contrast ratio
- **UI components:** Minimum 3:1 contrast ratio

Use browser evaluate to check contrast:
```javascript
// Check if any elements have insufficient contrast
// Focus on text-[var(--ui-text-muted)] on backgrounds
```

#### Interactive Elements
- [ ] All buttons have accessible names (text content or aria-label)
- [ ] All links have descriptive text (not just "click here")
- [ ] All form inputs have associated labels
- [ ] Focus states are visible on all interactive elements

#### Keyboard Navigation
Test by pressing Tab through the page:
```
mcp__playwright__browser_press_key({ key: "Tab" })
```
- [ ] Focus order is logical (left-to-right, top-to-bottom)
- [ ] No keyboard traps (can Tab out of all elements)
- [ ] Skip links available for main content

#### Form Accessibility
- [ ] All inputs have visible labels (not just placeholders)
- [ ] Required fields are indicated
- [ ] Error messages are associated with inputs
- [ ] Form validation errors are announced

#### Images and Icons
- [ ] Decorative images have `alt=""`
- [ ] Informative images have descriptive alt text
- [ ] Icon-only buttons have aria-label

#### ARIA Usage
- [ ] ARIA roles are used correctly
- [ ] ARIA states (expanded, selected, etc.) are accurate
- [ ] Live regions announce dynamic content

### 4. Visual Checks

Take screenshots for manual review if needed:
```
mcp__playwright__browser_take_screenshot({ filename: "a11y-[route].png" })
```

Check:
- [ ] Text is readable at 200% zoom
- [ ] Content reflows properly on narrow viewports
- [ ] No horizontal scrolling at 320px width

### 5. Dark Mode Testing

Switch to dark mode and repeat contrast checks:
- Navigate to the page
- Toggle dark mode (if available)
- Re-run contrast checks

## Output Format

```
## Accessibility Audit Report

**Route Tested:** [route]
**Date:** [timestamp]
**WCAG Level:** AA

### Summary

| Category | Status | Issues |
|----------|--------|--------|
| Color Contrast | PASS/FAIL | X issues |
| Keyboard Navigation | PASS/FAIL | X issues |
| Form Accessibility | PASS/FAIL | X issues |
| Interactive Elements | PASS/FAIL | X issues |
| ARIA Usage | PASS/FAIL | X issues |

### Critical Issues (Must Fix)

#### Issue 1: [Title]
- **Element:** `[selector or description]`
- **Problem:** [what's wrong]
- **WCAG Criterion:** [e.g., 1.4.3 Contrast (Minimum)]
- **Fix:** [how to fix it]

### Warnings (Should Fix)

[Less critical issues]

### Passing Checks

- [x] All buttons have accessible names
- [x] Focus states are visible
- [etc.]

### Recommendations

1. [Improvement suggestion]
2. [Best practice recommendation]

### Screenshots

[If taken, list screenshot filenames]
```

## WCAG 2.1 AA Quick Reference

### Level A (Must Have)
- 1.1.1 Non-text Content (alt text)
- 1.3.1 Info and Relationships (semantic HTML)
- 2.1.1 Keyboard (all functionality via keyboard)
- 2.4.1 Bypass Blocks (skip links)
- 4.1.1 Parsing (valid HTML)
- 4.1.2 Name, Role, Value (accessible names)

### Level AA (Should Have)
- 1.4.3 Contrast (Minimum) - 4.5:1 / 3:1
- 1.4.4 Resize Text (200% zoom)
- 1.4.10 Reflow (320px width)
- 2.4.6 Headings and Labels (descriptive)
- 2.4.7 Focus Visible (visible focus states)

## Critical Rules

- Use Playwright MCP for all browser interactions
- Dev server must be running at localhost:3000
- Test both light and dark modes
- Provide specific selectors or descriptions for each issue
- Reference exact WCAG criteria for violations
- Do NOT make any code changes - this is an audit only
