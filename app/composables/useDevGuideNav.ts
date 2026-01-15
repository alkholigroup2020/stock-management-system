/**
 * useDevGuideNav
 *
 * Composable for managing Developer Guide navigation state
 * - Active section and subsection tracking
 * - Navigation functions
 * - Search state and filtering
 * - Sidebar collapse state
 */

/**
 * Represents a navigation section in the developer guide sidebar
 */
export interface DocSection {
  /** Unique identifier used in URL path */
  id: string;
  /** Display label in sidebar */
  label: string;
  /** Heroicons icon name */
  icon: string;
  /** Component name to render for this section (auto-imported by Nuxt) */
  componentName: string;
  /** Optional subsections for nested navigation */
  subsections?: DocSubsection[];
}

/**
 * Represents a subsection within a documentation section
 */
export interface DocSubsection {
  /** Unique identifier for deep linking */
  id: string;
  /** Display label */
  label: string;
  /** Anchor target within the section */
  anchor: string;
}

/**
 * Represents a search result from the documentation
 */
export interface SearchResult {
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

/**
 * All navigation sections for the developer guide
 * Components are auto-imported by Nuxt
 */
const navSections: DocSection[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: "i-heroicons-rocket-launch",
    componentName: "DeveloperGettingStartedDev",
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: "i-heroicons-squares-2x2",
    componentName: "DeveloperArchitectureOverview",
  },
  {
    id: "authentication",
    label: "Authentication",
    icon: "i-heroicons-lock-closed",
    componentName: "DeveloperAuthenticationGuide",
  },
  {
    id: "database",
    label: "Database",
    icon: "i-heroicons-server-stack",
    componentName: "DeveloperDatabaseGuide",
  },
  {
    id: "state-management",
    label: "State Management",
    icon: "i-heroicons-cube-transparent",
    componentName: "DeveloperStateManagementGuide",
  },
  {
    id: "caching-system",
    label: "Caching System",
    icon: "i-heroicons-square-3-stack-3d",
    componentName: "DeveloperCachingSystemGuide",
  },
  {
    id: "multi-location",
    label: "Multi-Location",
    icon: "i-heroicons-map-pin",
    componentName: "DeveloperMultiLocationGuide",
  },
  {
    id: "deliveries-wac",
    label: "Deliveries & WAC",
    icon: "i-heroicons-truck",
    componentName: "DeveloperDeliveriesWACGuide",
  },
  {
    id: "issues",
    label: "Issues",
    icon: "i-heroicons-archive-box-arrow-down",
    componentName: "DeveloperIssuesGuide",
  },
  {
    id: "transfers",
    label: "Transfers",
    icon: "i-heroicons-arrows-right-left",
    componentName: "DeveloperTransfersGuide",
  },
  {
    id: "items-management",
    label: "Items Management",
    icon: "i-heroicons-cube",
    componentName: "DeveloperItemsManagementGuide",
  },
  {
    id: "ncr",
    label: "NCR",
    icon: "i-heroicons-exclamation-triangle",
    componentName: "DeveloperNCRGuide",
  },
  {
    id: "reconciliation",
    label: "Reconciliation",
    icon: "i-heroicons-calculator",
    componentName: "DeveloperReconciliationGuide",
  },
  {
    id: "period-management",
    label: "Period Management",
    icon: "i-heroicons-calendar-days",
    componentName: "DeveloperPeriodManagementGuide",
  },
  {
    id: "pob",
    label: "POB",
    icon: "i-heroicons-users",
    componentName: "DeveloperPOBGuide",
  },
  {
    id: "data-fetching",
    label: "Data Fetching",
    icon: "i-heroicons-cloud-arrow-down",
    componentName: "DeveloperDataFetchingComposablesGuide",
  },
  {
    id: "server-api",
    label: "Server API Patterns",
    icon: "i-heroicons-server",
    componentName: "DeveloperServerApiPatternsGuide",
  },
  {
    id: "forms-validation",
    label: "Forms & Validation",
    icon: "i-heroicons-clipboard-document-check",
    componentName: "DeveloperFormsValidationGuide",
  },
  {
    id: "component-patterns",
    label: "Component Patterns",
    icon: "i-heroicons-puzzle-piece",
    componentName: "DeveloperComponentPatternsGuide",
  },
  {
    id: "tables-lists",
    label: "Tables & Lists",
    icon: "i-heroicons-table-cells",
    componentName: "DeveloperTablesListsGuide",
  },
  {
    id: "error-handling",
    label: "Error Handling",
    icon: "i-heroicons-exclamation-circle",
    componentName: "DeveloperErrorHandlingGuide",
  },
];

const SIDEBAR_STATE_KEY = "dev-guide-sidebar-collapsed";

export const useDevGuideNav = () => {
  const route = useRoute();
  const router = useRouter();

  // Desktop sidebar collapse state (persisted)
  const sidebarCollapsed = ref(false);

  // Mobile menu open state (not persisted)
  const mobileMenuOpen = ref(false);

  // Load sidebar state from localStorage
  onMounted(() => {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (stored !== null) {
      sidebarCollapsed.value = stored === "true";
    }
  });

  const searchQuery = ref("");
  const isSearching = ref(false);

  // Computed properties
  const activeSection = computed(() => {
    const slug = route.params.slug as string[] | undefined;
    return slug?.[0] || "getting-started";
  });

  const activeSubsection = computed(() => {
    const slug = route.params.slug as string[] | undefined;
    return slug?.[1] || null;
  });

  // Search results computed from searchable content
  const searchResults = computed<SearchResult[]>(() => {
    const query = searchQuery.value.trim().toLowerCase();
    if (!query) return [];

    // Note: Searchable content would go here - moved to DevGuideDrawer.vue for now
    // due to large size. In real implementation, extract to separate file or function.
    return [];
  });

  // Navigation functions
  const navigateToSection = (sectionId: string) => {
    return navigateTo(`/dev-guide/${sectionId}`);
  };

  const navigateToSubsection = (sectionId: string, subsectionId: string) => {
    return navigateTo(`/dev-guide/${sectionId}/${subsectionId}`);
  };

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarCollapsed.value));
  };

  const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  };

  const closeMobileMenu = () => {
    mobileMenuOpen.value = false;
  };

  const clearSearch = () => {
    searchQuery.value = "";
  };

  return {
    // State
    activeSection,
    activeSubsection,
    sidebarCollapsed,
    mobileMenuOpen,
    searchQuery,
    isSearching,
    searchResults,
    navSections,

    // Functions
    navigateToSection,
    navigateToSubsection,
    toggleSidebar,
    toggleMobileMenu,
    closeMobileMenu,
    clearSearch,
  };
};
