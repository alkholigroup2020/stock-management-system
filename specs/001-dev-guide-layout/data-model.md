# Data Model: Developer Guide Documentation Layout

**Feature Branch**: `001-dev-guide-layout`
**Date**: 2026-01-14

## Overview

This feature is client-side only and does not involve database entities. The "data model" describes the TypeScript interfaces and navigation structure used for the documentation system.

## TypeScript Interfaces

### Navigation Section

```typescript
// app/composables/useDevGuideNav.ts

/**
 * Represents a navigation section in the developer guide sidebar
 */
interface DocSection {
  /** Unique identifier used in URL path */
  id: string;
  /** Display label in sidebar */
  label: string;
  /** Heroicons icon name */
  icon: string;
  /** Vue component to render for this section */
  component: Component;
  /** Optional subsections for nested navigation */
  subsections?: DocSubsection[];
}

/**
 * Represents a subsection within a documentation section
 */
interface DocSubsection {
  /** Unique identifier for deep linking */
  id: string;
  /** Display label */
  label: string;
  /** Anchor target within the section */
  anchor: string;
}
```

### Search Result

```typescript
// Reused from existing DevGuideDrawer.vue

/**
 * Represents a search result from the documentation
 */
interface SearchResult {
  /** Unique identifier for the result */
  id: string;
  /** Parent section name (e.g., "Authentication") */
  section: string;
  /** Section ID for navigation */
  sectionId: string;
  /** Target subsection for deep linking */
  targetSection: string;
  /** Result title */
  title: string;
  /** Searchable content snippet */
  content: string;
  /** Icon to display with result */
  icon: string;
}
```

### Navigation State

```typescript
// app/composables/useDevGuideNav.ts

/**
 * State returned by useDevGuideNav composable
 */
interface DevGuideNavState {
  /** Currently active section ID from route */
  activeSection: ComputedRef<string>;
  /** Current subsection for deep linking */
  activeSubsection: ComputedRef<string | null>;
  /** Whether sidebar is collapsed (mobile/tablet) */
  sidebarCollapsed: Ref<boolean>;
  /** Current search query */
  searchQuery: Ref<string>;
  /** Filtered search results */
  searchResults: ComputedRef<SearchResult[]>;
  /** Whether search is in progress */
  isSearching: Ref<boolean>;
  /** All navigation sections */
  navSections: DocSection[];
  /** Navigate to a section */
  navigateToSection: (sectionId: string) => void;
  /** Navigate to a subsection */
  navigateToSubsection: (sectionId: string, subsectionId: string) => void;
  /** Toggle sidebar visibility */
  toggleSidebar: () => void;
  /** Clear search query */
  clearSearch: () => void;
}
```

## Navigation Structure

The documentation is organized into the following sections:

```typescript
const navSections: DocSection[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "i-heroicons-rocket-launch",
    component: GettingStartedDev,
    subsections: [
      { id: "prerequisites", label: "Prerequisites", anchor: "dev-section-prerequisites" },
      { id: "installation", label: "Installation", anchor: "dev-section-installation" },
      { id: "commands", label: "Commands", anchor: "dev-section-commands" },
      { id: "database", label: "Database", anchor: "dev-section-database" },
    ],
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: "i-heroicons-squares-2x2",
    component: ArchitectureOverview,
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: "i-heroicons-lock-closed",
    component: AuthenticationGuide,
  },
  {
    id: "database",
    label: "Database",
    icon: "i-heroicons-server-stack",
    component: DatabaseGuide,
  },
  {
    id: "state-management",
    label: "State Management",
    icon: "i-heroicons-cube-transparent",
    component: StateManagementGuide,
  },
  {
    id: "caching-system",
    label: "Caching System",
    icon: "i-heroicons-square-3-stack-3d",
    component: CachingSystemGuide,
  },
  {
    id: "multi-location",
    label: "Multi-Location",
    icon: "i-heroicons-map-pin",
    component: MultiLocationGuide,
  },
  {
    id: "deliveries-wac",
    label: "Deliveries & WAC",
    icon: "i-heroicons-truck",
    component: DeliveriesWACGuide,
  },
  {
    id: "issues",
    label: "Issues",
    icon: "i-heroicons-archive-box-arrow-down",
    component: IssuesGuide,
  },
  {
    id: "transfers",
    label: "Transfers",
    icon: "i-heroicons-arrows-right-left",
    component: TransfersGuide,
  },
  {
    id: "ncr",
    label: "NCR",
    icon: "i-heroicons-exclamation-triangle",
    component: NCRGuide,
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: "i-heroicons-calculator",
    component: ReconciliationGuide,
  },
  {
    id: "period-management",
    label: "Period Management",
    icon: "i-heroicons-calendar-days",
    component: PeriodManagementGuide,
  },
  {
    id: "pob",
    label: "POB",
    icon: "i-heroicons-users",
    component: POBGuide,
  },
  {
    id: "data-fetching",
    label: "Data Fetching",
    icon: "i-heroicons-cloud-arrow-down",
    component: DataFetchingComposablesGuide,
  },
  {
    id: "server-api",
    label: "Server API Patterns",
    icon: "i-heroicons-server",
    component: ServerApiPatternsGuide,
  },
  {
    id: "forms-validation",
    label: "Forms & Validation",
    icon: "i-heroicons-clipboard-document-check",
    component: FormsValidationGuide,
  },
  {
    id: "component-patterns",
    label: "Component Patterns",
    icon: "i-heroicons-puzzle-piece",
    component: ComponentPatternsGuide,
  },
  {
    id: "tables-lists",
    label: "Tables & Lists",
    icon: "i-heroicons-table-cells",
    component: TablesListsGuide,
  },
  {
    id: "error-handling",
    label: "Error Handling",
    icon: "i-heroicons-exclamation-circle",
    component: ErrorHandlingGuide,
  },
];
```

## URL Structure

| URL Pattern | Example | Maps To |
|-------------|---------|---------|
| `/dev-guide` | `/dev-guide` | Getting Started (default) |
| `/dev-guide/:section` | `/dev-guide/authentication` | Section component |
| `/dev-guide/:section/:subsection` | `/dev-guide/authentication/login-flow` | Section + scroll to subsection |

## Route Parameters

```typescript
// Route params from [...slug].vue
interface DevGuideRouteParams {
  slug: string[]; // e.g., ["authentication", "login-flow"]
}

// Parsed into:
// - slug[0] = section ID
// - slug[1] = subsection ID (optional)
```

## State Persistence

```typescript
// localStorage key for sidebar state
const SIDEBAR_STATE_KEY = "dev-guide-sidebar-collapsed";

// Persisted between sessions
interface PersistedState {
  sidebarCollapsed: boolean;
}
```

## Relationships

```
DocSection (1) ──────────▶ (1) Vue Component
     │
     │ has many
     ▼
DocSubsection (*)

SearchResult ──────────▶ DocSection (via sectionId)
     │
     └──────────▶ DocSubsection (via targetSection)
```

## Validation Rules

| Field | Rule |
|-------|------|
| `DocSection.id` | Must be URL-safe (lowercase, hyphens only) |
| `DocSection.icon` | Must be valid Heroicons name |
| `DocSection.component` | Must be imported Vue component |
| `SearchResult.content` | Max 500 characters for display |
