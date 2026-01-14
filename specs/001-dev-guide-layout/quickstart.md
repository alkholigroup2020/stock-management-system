# Quickstart & Testing: Developer Guide Documentation Layout

**Feature Branch**: `001-dev-guide-layout`
**Date**: 2026-01-14

## Quick Verification

After implementation, verify these scenarios work correctly:

### 1. Access Documentation (P1 - Core)

```bash
# Start dev server
pnpm dev

# Open browser to localhost:3000
# Login as any user
```

**Test Steps**:

1. Look at the main navbar - verify dev guide icon (code bracket) is visible
2. Click the dev guide icon
3. Verify navigation to `/dev-guide` page
4. Verify documentation layout appears with sidebar and content

**Expected Result**: Full-page documentation with sidebar navigation and "Getting Started" content displayed.

### 2. Production Mode Exclusion

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

**Test Steps**:

1. Open browser to the preview URL
2. Check navbar for dev guide icon

**Expected Result**: Dev guide icon is NOT visible in production build.

### 3. Sidebar Navigation (P2)

**Test Steps**:

1. Navigate to `/dev-guide`
2. Click "Authentication" in sidebar
3. Verify URL changes to `/dev-guide/authentication`
4. Verify Authentication content loads
5. Verify "Authentication" is highlighted in sidebar
6. Click "Database" in sidebar
7. Verify URL and content update accordingly

**Expected Result**: Content updates without page reload, sidebar shows active state.

### 4. Deep Linking (P2)

**Test Steps**:

1. Open a new browser tab
2. Navigate directly to `http://localhost:3000/dev-guide/state-management`
3. Verify page loads with State Management content
4. Verify "State Management" is highlighted in sidebar

**Expected Result**: Direct URL access works, correct section displayed.

### 5. Keyboard Shortcut

**Test Steps**:

1. Navigate to any page in the main app (e.g., `/deliveries`)
2. Press `Ctrl+Shift+D`
3. Verify navigation to `/dev-guide`

**Expected Result**: Keyboard shortcut opens documentation page (not a drawer).

### 6. Search Functionality (P3)

**Test Steps**:

1. Navigate to `/dev-guide`
2. Click in search input
3. Type "WAC"
4. Verify search results appear (should include Deliveries & WAC section)
5. Click a search result
6. Verify navigation to correct section

**Expected Result**: Search returns relevant results, clicking navigates correctly.

### 7. Return to Application (P3)

**Test Steps**:

1. Navigate to `/deliveries` in main app
2. Open dev guide via icon or shortcut
3. Click the "Back to App" button or logo
4. Verify return to `/deliveries` (or dashboard)

**Alternative Test**:

1. From dev guide, click browser back button
2. Verify return to previous location

**Expected Result**: Easy return to main application.

### 8. Responsive Design

**Desktop (1024px+)**:

- Sidebar always visible
- Content area has comfortable width

**Tablet (768-1023px)**:

- Sidebar collapsed by default
- Toggle button visible
- Content takes more width

**Mobile (<768px)**:

- Sidebar hidden by default
- Toggle button in header
- Content takes full width

**Test Steps**:

1. Use browser DevTools to resize viewport
2. Verify sidebar behavior at each breakpoint
3. Verify toggle button works on tablet/mobile

### 9. Dark Mode

**Test Steps**:

1. Toggle theme to dark mode using navbar button
2. Navigate through dev guide sections
3. Verify all text readable
4. Verify code blocks have appropriate dark styling
5. Verify no contrast issues

**Expected Result**: Full dark mode support with proper contrast.

### 10. Accessibility

**Keyboard Navigation**:

1. Tab through sidebar items
2. Verify visible focus indicators
3. Press Enter to select
4. Tab through search input and results

**Screen Reader** (optional):

1. Use VoiceOver/NVDA to navigate
2. Verify landmarks are announced
3. Verify section headings readable

## Playwright MCP Verification

Use the Playwright MCP to verify key scenarios:

```javascript
// Navigate and take screenshot
await page.goto("http://localhost:3000/dev-guide");
await page.waitForSelector('[data-testid="docs-sidebar"]');

// Verify sidebar navigation
await page.click("text=Authentication");
await expect(page).toHaveURL(/\/dev-guide\/authentication/);

// Verify search
await page.fill('[data-testid="docs-search"]', "WAC");
await page.waitForSelector('[data-testid="search-results"]');
```

## Common Issues & Solutions

| Issue                      | Solution                                   |
| -------------------------- | ------------------------------------------ |
| Dev icon not visible       | Check `import.meta.dev` is working         |
| Page 404 in production     | Verify middleware redirects correctly      |
| Sidebar not updating       | Check `useDevGuideNav` reactive state      |
| Search not finding content | Verify searchable content array complete   |
| Deep links broken          | Check `[...slug].vue` route params parsing |

## Success Criteria Verification

| Criteria                        | How to Verify                                |
| ------------------------------- | -------------------------------------------- |
| SC-001: 1 click access          | Count clicks from main app to docs           |
| SC-002: 2 clicks to any section | Count clicks from landing to deepest section |
| SC-003: < 2s page load          | Use browser DevTools Performance tab         |
| SC-004: 100% content preserved  | Compare section list before/after            |
| SC-005: < 500ms search          | Time from typing to results displayed        |
| SC-006: Responsive layout       | Test at 1024px, 768px, 375px widths          |
