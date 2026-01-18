# Research: POB Print Report

**Feature**: 001-bop-print-report
**Date**: 2026-01-18
**Status**: Complete

## Research Summary

This feature is straightforward with no critical unknowns. Research focused on best practices for CSS print styling in Vue/Nuxt applications and browser print API patterns.

---

## 1. CSS Print Media Queries in Tailwind CSS v4

### Decision
Use `@media print` rules in `main.css` with Tailwind's print variant for component-specific styles.

### Rationale
- Tailwind CSS v4 supports print variants natively (`print:hidden`, `print:block`)
- Global print styles in `main.css` provide consistent behavior across the application
- Component-scoped styles can use `<style scoped>` with `@media print` for specificity

### Alternatives Considered
1. **Inline print styles only** - Rejected: harder to maintain, verbose
2. **Separate print stylesheet** - Rejected: unnecessary complexity for single feature
3. **Print-specific component with conditional rendering** - Selected hybrid approach

### Implementation Pattern
```css
/* Global print styles in main.css */
@media print {
  /* Hide non-printable elements */
  .no-print,
  nav,
  header,
  footer:not(.print-footer) {
    display: none !important;
  }

  /* A4 page setup */
  @page {
    size: A4;
    margin: 15mm;
  }

  /* Force background colors/images */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

---

## 2. Browser Print API (`window.print()`)

### Decision
Use `window.print()` with a dedicated print component that renders only during print mode.

### Rationale
- `window.print()` is universally supported across all modern browsers
- No external dependencies required
- User gets native print preview and settings

### Alternatives Considered
1. **PDF generation library (jsPDF, pdfmake)** - Rejected: adds bundle size, complexity
2. **Server-side PDF generation** - Rejected: requires new API endpoint, overkill
3. **Print.js library** - Rejected: unnecessary dependency for simple use case

### Implementation Pattern
```typescript
function handlePrint() {
  // Show print component
  showPrintView.value = true;

  // Wait for Vue to render, then print
  nextTick(() => {
    window.print();
    // Optionally hide after print dialog closes
  });
}
```

---

## 3. Print Layout Component Pattern

### Decision
Create a dedicated `POBPrintReport.vue` component that is hidden in normal view but displayed during print.

### Rationale
- Separates print-specific layout from interactive UI
- Easier to test and maintain
- Can be conditionally rendered or always present but hidden

### Implementation Approach
Two viable patterns:

**Pattern A: Conditional Render (Selected)**
```vue
<template>
  <!-- Normal POB page content -->
  <div class="print:hidden">
    <!-- Interactive UI -->
  </div>

  <!-- Print-only content -->
  <POBPrintReport
    v-if="showPrintView"
    class="hidden print:block"
    :data="pobData"
  />
</template>
```

**Pattern B: Always Present, CSS Toggle**
```vue
<template>
  <div class="print:hidden">
    <!-- Normal content -->
  </div>
  <POBPrintReport
    class="hidden print:block"
    :data="pobData"
  />
</template>
```

Selected Pattern A for explicit control and avoiding unnecessary DOM elements.

---

## 4. Signature Block Design

### Decision
Use flex layout with three equal-width columns, each containing a label, signature line, and date field.

### Rationale
- Equal spacing looks professional
- Clear visual hierarchy (label → line → date)
- Works well on A4 paper width

### Implementation Pattern
```vue
<div class="flex justify-between gap-8 mt-12">
  <div class="flex-1 text-center">
    <p class="text-sm font-medium mb-8">Operator Signature</p>
    <div class="border-t border-black pt-2">
      <p class="text-xs text-gray-600">Date: _______________</p>
    </div>
  </div>
  <!-- Repeat for Manager and Client -->
</div>
```

---

## 5. Multi-Page Pagination

### Decision
Use CSS `break-inside: avoid` on table rows and `break-after: avoid` on header sections.

### Rationale
- Native CSS pagination is well-supported for print
- Prevents awkward page breaks mid-row or mid-section
- Signature block naturally falls on last page

### Implementation Pattern
```css
@media print {
  .print-header {
    break-after: avoid;
  }

  .print-table tr {
    break-inside: avoid;
  }

  .print-signatures {
    break-before: avoid;
    margin-top: auto; /* Push to bottom if space allows */
  }
}
```

---

## 6. Existing Project Patterns

### Relevant Existing Code
- `app/components/pob/POBSummary.vue` - Period/manday display format
- `app/components/pob/POBTable.vue` - Daily entries table structure
- `app/utils/format.ts` - Date formatting utilities

### Reusable Patterns
- Date formatting: `formatDate()` from utils
- Number formatting: `.toLocaleString()` for manday counts
- Card styling: Existing `.card-elevated` pattern (not needed for print)

---

## Dependencies

No new dependencies required. Uses:
- Tailwind CSS v4 (existing)
- Vue 3 Composition API (existing)
- Native browser print API

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Browser print inconsistencies | Low | Medium | Test on Chrome, Firefox, Edge; use standard CSS |
| Long periods cause multi-page issues | Low | Low | CSS pagination rules handle gracefully |
| Print button clicked while data loading | Low | Low | Disable button when loading or no data |

---

## Conclusion

All research items resolved. No external dependencies or complex integrations required. Proceed to Phase 1 design.
