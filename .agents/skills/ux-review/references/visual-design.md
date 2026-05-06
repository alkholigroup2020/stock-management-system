# Visual Design Principles

Evaluate visual hierarchy, spacing, typography, and consistency.

## Visual Hierarchy

### Size and Weight

- Primary actions largest/boldest
- Section headings clearly differentiate from body
- Supporting text smaller/lighter than main content

**Hierarchy check:**

1. Squint at the screen—can you identify 3 levels?
2. Primary CTA should be immediately visible
3. User's eye should flow: headline → key info → action

### Color Usage

- Primary color for main actions only (1-2 per screen)
- Semantic colors: red=error, green=success, yellow=warning
- Neutral grays for most UI; color adds meaning

**Nuxt UI color tokens:**

```
primary-*   → brand actions, focus states
gray-*      → text, backgrounds, borders
red-*       → errors, destructive actions
green-*     → success states
yellow-*    → warnings
```

### Spacing Creates Grouping

- Related items closer together
- Unrelated items separated by whitespace
- Consistent spacing rhythm throughout

## Typography

### Font Sizes (Tailwind defaults)

| Use             | Class                   | Size    |
| --------------- | ----------------------- | ------- |
| Page title      | `text-3xl` / `text-4xl` | 30-36px |
| Section heading | `text-xl` / `text-2xl`  | 20-24px |
| Card title      | `text-lg`               | 18px    |
| Body text       | `text-base`             | 16px    |
| Secondary text  | `text-sm`               | 14px    |
| Labels/captions | `text-xs`               | 12px    |

### Line Length

- Body text: 45-75 characters per line
- Tailwind: `max-w-prose` (65ch) for readability
- Avoid full-width text blocks

### Line Height

- Headings: `leading-tight` (1.25)
- Body text: `leading-normal` (1.5) or `leading-relaxed` (1.625)
- UI labels: `leading-none` (1) or `leading-tight` (1.25)

## Spacing System

### Tailwind Spacing Scale

Use consistent increments. Avoid arbitrary values.

| Token | Pixels | Use for                       |
| ----- | ------ | ----------------------------- |
| `1`   | 4px    | Tight gaps (icon + text)      |
| `2`   | 8px    | Related items, input padding  |
| `3`   | 12px   | List items, small cards       |
| `4`   | 16px   | Section padding, card padding |
| `6`   | 24px   | Between sections              |
| `8`   | 32px   | Major section breaks          |
| `12`  | 48px   | Page sections                 |
| `16`  | 64px   | Hero spacing                  |

### Spacing Patterns

```vue
<!-- Card internal padding -->
<UCard class="p-4 sm:p-6"></UCard>
```

### Common Spacing Issues

- ❌ Mixing `m-*` and `gap-*` inconsistently
- ❌ Arbitrary values (`mt-[13px]`) instead of scale
- ❌ Cramped padding on clickable elements
- ❌ Inconsistent spacing between same-type elements

## Alignment

### Grid Alignment

- Elements should align to invisible grid
- Left edges of content should align vertically
- Baseline alignment for text at same level

### Centering

- Center short content (headings, CTAs)
- Left-align body text and lists
- Don't center long paragraphs

**Check alignment:**

1. Draw vertical lines—do elements align?
2. Check left edge of content across sections
3. Ensure consistent margin from viewport edges

## Responsive Considerations

### Breakpoint Behavior

| Breakpoint | Tailwind     | Typical behavior                    |
| ---------- | ------------ | ----------------------------------- |
| Mobile     | default      | Single column, stacked              |
| Tablet     | `sm:`        | 2 columns, larger touch targets     |
| Desktop    | `md:`/`lg:`  | Multi-column, sidebar layouts       |
| Wide       | `xl:`/`2xl:` | Max-width container, larger spacing |

### Mobile-First Checks

- [ ] Touch targets ≥ 44px
- [ ] No horizontal scroll
- [ ] Important actions visible without scrolling
- [ ] Text readable without zooming
- [ ] Forms work with mobile keyboard

### Common Responsive Issues

- ❌ Desktop nav that doesn't collapse
- ❌ Tables that break on mobile (use cards or horizontal scroll)
- ❌ Fixed widths that overflow viewport
- ❌ Hover-only interactions with no touch alternative

## Consistency Audit

Check these are uniform throughout:

- [ ] Button sizes for same action levels
- [ ] Card border-radius values
- [ ] Shadow depths for elevation levels
- [ ] Icon sizes (16px, 20px, 24px increments)
- [ ] Input heights and padding
- [ ] Color usage for same semantic meaning
- [ ] Heading styles at same hierarchy level
