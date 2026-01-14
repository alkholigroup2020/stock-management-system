# Research: Developer Guide Documentation Layout

**Feature Branch**: `001-dev-guide-layout`
**Date**: 2026-01-14

## Research Questions

### 1. Nuxt 4 Layout Patterns for Documentation

**Decision**: Use a custom `docs.vue` layout with `UDashboardGroup` and `UDashboardSidebar` from Nuxt UI

**Rationale**:
- Nuxt UI provides `UDashboardSidebar` which matches the existing app's sidebar pattern
- The `docs` layout will be separate from the main `default.vue` layout
- Allows consistent styling with the rest of the application
- Built-in responsive behavior (collapsible sidebar)

**Alternatives Considered**:
- **Nuxt Content module**: Overkill for internal dev docs; requires markdown files
- **Plain page with manual sidebar**: More code, less consistent with app patterns
- **Third-party docs theme (Docus)**: Too heavy, external dependency for internal tool

### 2. Routing Strategy for Deep Linking

**Decision**: Use dynamic catch-all route `[...slug].vue` under `/dev-guide/`

**Rationale**:
- Enables URLs like `/dev-guide/authentication`, `/dev-guide/database`
- Catch-all allows section and subsection paths: `/dev-guide/authentication/login-flow`
- Vue Router handles navigation without full page reloads
- Back button works naturally with browser history

**Alternatives Considered**:
- **Hash-based navigation**: `#authentication` - Works but URLs less semantic
- **Query parameters**: `?section=auth` - Works but less clean URLs
- **Single page with scroll**: No deep linking possible

### 3. Navigation State Management

**Decision**: Create `useDevGuideNav` composable with reactive state

**Rationale**:
- Centralized navigation state (active section, sidebar collapsed, search state)
- Reactive updates when URL changes
- Composable pattern matches existing codebase (`useAuth`, `useCache`, etc.)
- Can persist sidebar state to localStorage

**Implementation**:
```typescript
// app/composables/useDevGuideNav.ts
export const useDevGuideNav = () => {
  const route = useRoute();
  const activeSection = computed(() => route.params.slug?.[0] || "getting-started");
  const sidebarCollapsed = ref(false);
  const searchQuery = ref("");
  // ... navigation logic
};
```

### 4. Search Implementation

**Decision**: Client-side fuzzy search using existing searchable content structure

**Rationale**:
- Existing `DevGuideDrawer` already has complete search index
- No server needed - all content is in-memory
- Fast performance (< 500ms requirement easily met)
- Can reuse existing `SearchResult` interface and content structure

**Implementation Approach**:
- Move searchable content to a shared data file
- Use computed property for filtering
- Debounce input (150ms) for better UX

### 5. Dev-Mode Access Control

**Decision**: Use route middleware + `import.meta.dev` check

**Rationale**:
- Nuxt provides `import.meta.dev` for dev mode detection
- Route middleware can redirect to 404 in production
- Navbar icon already uses this pattern

**Implementation**:
```typescript
// app/middleware/dev-only.ts
export default defineNuxtRouteMiddleware(() => {
  if (!import.meta.dev) {
    return navigateTo("/", { redirectCode: 404 });
  }
});
```

### 6. Existing Component Reuse Strategy

**Decision**: Reuse all existing guide components with minimal modifications

**Rationale**:
- 20+ guide components already exist and work well
- Only need to adjust the wrapper/injection context
- Existing `inject("devTargetSection")` pattern for deep linking works
- No content migration needed

**Components to Reuse (Complete List)**:
1. `GettingStartedDev.vue`
2. `ArchitectureOverview.vue`
3. `AuthenticationGuide.vue`
4. `DatabaseGuide.vue`
5. `StateManagementGuide.vue`
6. `CachingSystemGuide.vue`
7. `MultiLocationGuide.vue`
8. `DeliveriesWACGuide.vue`
9. `IssuesGuide.vue`
10. `TransfersGuide.vue`
11. `NCRGuide.vue`
12. `ReconciliationGuide.vue`
13. `PeriodManagementGuide.vue`
14. `POBGuide.vue`
15. `DataFetchingComposablesGuide.vue`
16. `ServerApiPatternsGuide.vue`
17. `FormsValidationGuide.vue`
18. `ComponentPatternsGuide.vue`
19. `TablesListsGuide.vue`
20. `ErrorHandlingGuide.vue`
21. `CodeBlock.vue` (utility component)

### 7. Keyboard Shortcut Handling

**Decision**: Modify existing Ctrl+Shift+D handler to navigate instead of opening drawer

**Rationale**:
- Existing handler in `default.vue` layout
- Change from `devDrawerOpen.value = true` to `navigateTo("/dev-guide")`
- Preserves muscle memory for developers

**Implementation**:
```typescript
// In default.vue layout
if (event.key === "D" && event.ctrlKey && event.shiftKey && showDevTools.value) {
  event.preventDefault();
  navigateTo("/dev-guide");
}
```

### 8. Responsive Design Breakpoints

**Decision**: Follow existing app breakpoints with sidebar behavior

**Rationale**:
- Desktop (1024px+): Sidebar always visible
- Tablet (768-1023px): Sidebar collapsible
- Mobile (<768px): Sidebar hidden by default, toggle button

**Matches existing patterns in**:
- `default.vue` layout sidebar
- `DevGuideDrawer.vue` responsive behavior

## Summary of Key Decisions

| Topic | Decision | Risk Level |
|-------|----------|------------|
| Layout | Custom `docs.vue` with Nuxt UI components | Low |
| Routing | `[...slug].vue` catch-all for deep linking | Low |
| State | `useDevGuideNav` composable | Low |
| Search | Client-side with existing index | Low |
| Access Control | Route middleware + `import.meta.dev` | Low |
| Components | Reuse all 20+ existing components | Low |
| Keyboard | Navigate to page instead of drawer | Low |
| Responsive | Match existing app breakpoints | Low |

**Overall Risk Assessment**: LOW - All decisions follow established patterns in the codebase.
