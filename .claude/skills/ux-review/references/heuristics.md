# Usability Heuristics

Nielsen's 10 heuristics with evaluation questions for each.

## 1. Visibility of System Status

Keep users informed about what's happening.

**Check for:**
- Loading states on async operations
- Progress indicators for multi-step flows
- Success/error feedback after actions
- Current location in navigation (active states)
- Form validation feedback (inline, not just on submit)

**Nuxt UI patterns:**
- `UButton` loading prop for async actions
- `UProgress` for file uploads or long operations
- `UNotification` for action feedback
- `USkeleton` for loading placeholders

## 2. Match Between System and Real World

Use familiar language and concepts.

**Check for:**
- Jargon-free labels (unless domain-specific audience)
- Icons that match common mental models
- Logical information grouping
- Natural reading order (top-to-bottom, left-to-right in LTR)
- Date/time formats appropriate to locale

## 3. User Control and Freedom

Support undo, cancel, and escape routes.

**Check for:**
- Cancel buttons on forms and modals
- Undo for destructive actions
- Clear way to exit modals (X button, click outside, Escape key)
- Back navigation that preserves state
- Confirmation dialogs for irreversible actions

**Nuxt UI patterns:**
- `UModal` with `close-button` and `prevent-close` props
- `UButton` with `variant="ghost"` for cancel actions

## 4. Consistency and Standards

Follow platform conventions.

**Check for:**
- Consistent button styles for same action types
- Standard icon meanings (trash = delete, pencil = edit)
- Uniform spacing scale (Tailwind: 4, 8, 12, 16, 24, 32, 48)
- Consistent terminology across pages
- Primary actions visually distinguished from secondary

**Tailwind consistency:**
- Use `gap-*` over margin for flex/grid children
- Stick to spacing scale: `p-4`, `p-6`, `p-8` (not arbitrary values)
- Color tokens over raw hex values

## 5. Error Prevention

Prevent errors before they occur.

**Check for:**
- Disabled states for invalid actions
- Input constraints (maxlength, type="email", etc.)
- Confirmation for destructive actions
- Smart defaults that reduce input
- Clear placeholder text showing expected format

**Nuxt UI patterns:**
- `UInput` with `type`, `maxlength`, `pattern` attributes
- `UFormGroup` with validation rules
- `UPopover` for inline help/hints

## 6. Recognition Rather Than Recall

Make options visible; don't rely on memory.

**Check for:**
- Labels on icons (especially on mobile)
- Visible navigation (not hidden in hamburger on desktop)
- Autocomplete/suggestions for search
- Recent items or history
- Contextual help near complex fields

**Nuxt UI patterns:**
- `UTooltip` for icon-only buttons
- `UCommandPalette` for searchable actions
- `USelectMenu` with search for long lists

## 7. Flexibility and Efficiency of Use

Support both novice and expert users.

**Check for:**
- Keyboard shortcuts for frequent actions
- Bulk operations for repetitive tasks
- Customizable defaults or preferences
- Quick actions (right-click menus, swipe gestures)
- Accelerators that don't hide basic functionality

**Nuxt UI patterns:**
- `UKbd` to display keyboard shortcuts
- `UContextMenu` for power-user actions
- `defineShortcuts` composable for keyboard handling

## 8. Aesthetic and Minimalist Design

Remove unnecessary elements.

**Check for:**
- Every element serves a purpose
- No decorative-only elements that distract
- Information hierarchy through size/weight/color
- Adequate whitespace (not cramped)
- Focus on primary action per screen

**Tailwind red flags:**
- Excessive border decorations
- Too many competing colors
- Text walls without visual breaks
- Multiple CTAs competing for attention

## 9. Help Users Recognize, Diagnose, and Recover from Errors

Clear, constructive error messages.

**Check for:**
- Plain language (not error codes)
- Specific problem description
- Constructive solution suggestion
- Error shown near the problem source
- Errors don't clear user input

**Nuxt UI patterns:**
- `UFormGroup` error prop for inline errors
- `UAlert` with `color="red"` for page-level errors
- `UNotification` for transient errors

**Good error example:**
```
❌ "Error 422"
✅ "Email is already registered. Try logging in or use a different email."
```

## 10. Help and Documentation

Provide accessible help when needed.

**Check for:**
- Contextual help near complex features
- Searchable help/docs
- Onboarding for first-time users
- Empty states with guidance
- Tooltips for unfamiliar terms

**Nuxt UI patterns:**
- `UTooltip` for field hints
- `UPopover` for detailed explanations
- `UCard` empty states with action prompts
