# Accessibility Checklist

WCAG 2.1 AA requirements organized by category.

## Perceivable

### Images and Media
- [ ] Images have descriptive `alt` text (or `alt=""` if decorative)
- [ ] Complex images have extended descriptions
- [ ] Videos have captions
- [ ] Audio has transcripts

### Color and Contrast
- [ ] Text contrast ≥ 4.5:1 (normal text) or ≥ 3:1 (large text/UI)
- [ ] Information not conveyed by color alone
- [ ] Focus indicators visible against background
- [ ] Links distinguishable from surrounding text (not just color)

**Tailwind contrast tips:**
```
✅ text-gray-900 on bg-white (ratio ~21:1)
✅ text-gray-700 on bg-gray-100 (ratio ~7:1)
⚠️ text-gray-400 on bg-white (ratio ~3:1, fails for body text)
❌ text-gray-300 on bg-gray-100 (ratio ~1.5:1)
```

### Text and Readability
- [ ] Text resizable to 200% without loss of content
- [ ] No horizontal scrolling at 320px viewport width
- [ ] Line height ≥ 1.5 for body text
- [ ] Paragraph spacing ≥ 2× line height

## Operable

### Keyboard Navigation
- [ ] All interactive elements focusable via Tab
- [ ] Logical focus order (follows visual order)
- [ ] No keyboard traps
- [ ] Skip link to main content
- [ ] Focus visible on all interactive elements

**Focus indicator minimums:**
```vue
<!-- Nuxt UI default is accessible, but custom styles need: -->
<UButton class="focus:ring-2 focus:ring-offset-2 focus:ring-primary-500" />
```

### Interactive Elements
- [ ] Click targets ≥ 44×44px (touch) or ≥ 24×24px (pointer)
- [ ] Adequate spacing between targets (≥ 8px)
- [ ] Hover/focus states on all interactive elements
- [ ] Disabled states visually distinct

### Time and Motion
- [ ] No content flashing >3 times/second
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Auto-updating content can be paused
- [ ] Session timeouts warn before expiring

**Reduced motion pattern:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Understandable

### Forms
- [ ] Labels associated with inputs (`for`/`id` or wrapping)
- [ ] Required fields indicated (not just by asterisk color)
- [ ] Error messages identify the field and describe the problem
- [ ] Error suggestions provided when possible
- [ ] Input purpose identified (`autocomplete` attribute)

**Nuxt UI form pattern:**
```vue
<UFormGroup label="Email" required :error="errors.email">
  <UInput v-model="email" type="email" autocomplete="email" />
</UFormGroup>
```

### Language and Content
- [ ] Page language declared (`<html lang="en">`)
- [ ] Language changes marked (`<span lang="fr">`)
- [ ] Abbreviations explained on first use
- [ ] Reading level appropriate for audience

### Predictability
- [ ] Focus doesn't trigger unexpected changes
- [ ] Input doesn't trigger unexpected changes (unless warned)
- [ ] Navigation consistent across pages
- [ ] Components behave consistently

## Robust

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skips)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>`
- [ ] Tables have `<th>` with `scope`
- [ ] Landmarks used (`<main>`, `<nav>`, `<aside>`, etc.)
- [ ] Buttons are `<button>`, links are `<a>`

### ARIA Usage
- [ ] ARIA only when native HTML insufficient
- [ ] `aria-label` or `aria-labelledby` on unlabeled elements
- [ ] `aria-describedby` for additional context
- [ ] `aria-live` for dynamic content updates
- [ ] `role` attributes match element behavior

**Common ARIA patterns:**

```vue
<!-- Icon-only button -->
<UButton icon="i-heroicons-trash" aria-label="Delete item" />

<!-- Loading state -->
<UButton :loading="isLoading" :aria-busy="isLoading">
  Save
</UButton>

<!-- Modal -->
<UModal aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Delete</h2>
</UModal>

<!-- Live region for notifications -->
<div aria-live="polite" aria-atomic="true">
  {{ statusMessage }}
</div>
```

## Quick Audit Commands

Test keyboard navigation:
1. Unplug mouse, navigate with Tab/Shift+Tab
2. Activate elements with Enter/Space
3. Check focus visibility throughout

Test screen reader basics:
1. macOS: Cmd+F5 for VoiceOver
2. Check heading structure (VO+Cmd+H)
3. Check landmarks (VO+U → Landmarks)
4. Check form labels (VO+U → Form Controls)

Automated checks:
- Lighthouse accessibility audit
- axe DevTools browser extension
- WAVE browser extension
