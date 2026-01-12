<script setup lang="ts">
import type { Component } from "vue";

// Props
const props = defineProps<{
  open: boolean;
}>();

// Emits
const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

// Auth for role-based content
const { isAdmin, isSupervisor, isOperator } = useAuth();

// Sidebar collapsed state - collapsed on mobile by default, visible on desktop
const sidebarCollapsed = ref(true);

// Initialize sidebar state based on screen size
const initializeSidebarState = () => {
  if (typeof window !== "undefined") {
    sidebarCollapsed.value = window.innerWidth < 1024; // lg breakpoint
  }
};

// Watch for drawer open to set correct sidebar state
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      initializeSidebarState();
    }
  }
);

// Search state
const searchQuery = ref("");
const searchResults = ref<SearchResult[]>([]);
const isSearching = ref(false);

// Search result interface
interface SearchResult {
  id: string;
  section: string;
  sectionId: string;
  targetSection: string; // The section ID within the guide to expand
  title: string;
  content: string;
  icon: string;
}

// Target section for deep linking - provided to child components
const targetSubSection = ref<string | null>(null);
provide("helpTargetSection", targetSubSection);

// Searchable content database
const searchableContent = computed(() => {
  const content: SearchResult[] = [];

  // Getting Started content (always included)
  content.push(
    {
      id: "gs-welcome",
      section: "Getting Started",
      sectionId: "getting-started",
      targetSection: "", // No subsection for Getting Started
      title: "Welcome & Features",
      content:
        "Stock Management System streamlines inventory management across multiple locations, replacing Excel-based workflows. Features include multi-location stock tracking for Kitchen, Store, Central, Warehouse. Delivery management with automatic Weighted Average Cost (WAC) calculation. Stock issues tracking by cost centre. Inter-location transfers with approval workflows. Price variance detection with automatic NCRs. POB and Mandays calculation for cost-per-person reporting. Period-end reconciliation with coordinated month-end close.",
      icon: "i-heroicons-home",
    },
    {
      id: "gs-periods",
      section: "Getting Started",
      sectionId: "getting-started",
      targetSection: "",
      title: "Understanding Periods",
      content:
        "System operates on monthly accounting periods. Period indicator shows current status. OPEN status means you can post transactions. PENDING_CLOSE means period close in progress. CLOSED means no transactions can be posted.",
      icon: "i-heroicons-home",
    },
    {
      id: "gs-locations",
      section: "Getting Started",
      sectionId: "getting-started",
      targetSection: "",
      title: "Switching Locations",
      content:
        "Location switcher dropdown in top navigation bar. Click to open dropdown and select different location. Page refreshes with data for new location. All transactions recorded at currently selected location.",
      icon: "i-heroicons-home",
    },
    {
      id: "gs-rules",
      section: "Getting Started",
      sectionId: "getting-started",
      targetSection: "",
      title: "Key Rules",
      content:
        "No negative stock - cannot issue more than available. Location-specific - all transactions belong to active location. Period must be OPEN for transactions. Price variances automatically create NCRs.",
      icon: "i-heroicons-home",
    }
  );

  // Role-specific permissions content
  if (isOperator.value || isSupervisor.value || isAdmin.value) {
    const permSection = isAdmin.value
      ? "Admin Permissions"
      : isSupervisor.value
        ? "Supervisor Permissions"
        : "Operator Permissions";
    const permSectionId = isAdmin.value
      ? "admin-permissions"
      : isSupervisor.value
        ? "supervisor-permissions"
        : "operator-permissions";

    content.push({
      id: "perm-responsibilities",
      section: permSection,
      sectionId: permSectionId,
      targetSection: "",
      title: "Your Responsibilities",
      content:
        "View your role responsibilities and what you are expected to do in the system. Each role has specific duties and capabilities.",
      icon: "i-heroicons-shield-check",
    });

    content.push({
      id: "perm-matrix",
      section: permSection,
      sectionId: permSectionId,
      targetSection: "",
      title: "Permissions Matrix",
      content:
        "View the complete permissions matrix showing what features you can access. Dashboard, POB, Items, Deliveries, Issues, NCR, Stock, Reconciliations, Transfers, Period Prices, Period Close, User management, Location management.",
      icon: "i-heroicons-shield-check",
    });
  }

  // Operator Guide content - visible to all roles
  if (isOperator.value || isSupervisor.value || isAdmin.value) {
    content.push(
      {
        id: "op-deliveries",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "deliveries",
        title: "Deliveries",
        content:
          "Create new delivery by clicking Deliveries menu, then New Delivery. Select supplier, enter invoice number and delivery date. Add line items with item, quantity, and unit price. Post delivery to finalize. Price variance warning if price differs from period price. Save as draft to edit later, post to finalize and update stock.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-issues",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "issues",
        title: "Issues and Stock Usage",
        content:
          "Create new issue by clicking Issues menu, then Create Issue. Select issue date and cost centre. Add items with quantities. Cannot issue more than available stock. Submit to finalize and deduct from inventory.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-transfers",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "transfers",
        title: "Transfer Requests",
        content:
          "Create transfer requests to move stock between locations. Select source and destination locations, add items with quantities, provide justification. Transfers require Supervisor approval before stock moves.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-stock",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "stock",
        title: "Stock Viewing",
        content:
          "View current stock by clicking Stock Now. See items with quantities and values. Use search box to find specific items. Filter by category or low stock status. On Hand is physical quantity, WAC is weighted average cost, Total Value is On Hand times WAC.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-pob",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "pob",
        title: "POB Entry",
        content:
          "Enter daily counts by clicking POB menu. Enter mandays and visitors meals for each day. Total calculated automatically. Entries auto-save when moving to next field. View period totals at top of page.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-ncr",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "ncr",
        title: "NCR Non-Conformance Reports",
        content:
          "View NCRs by clicking NCR menu. NCRs track quality issues and price variances. Auto-generated NCRs created from price variances during delivery posting. Manual NCRs created by supervisors for quality issues.",
        icon: "i-heroicons-clipboard-document-list",
      },
      {
        id: "op-profile",
        section: "Operator Guide",
        sectionId: "operator-guide",
        targetSection: "profile",
        title: "Profile and Password",
        content:
          "View profile by clicking your name, then Profile. Change password in Profile page. Password requires 8 characters, uppercase, lowercase, number, and special character.",
        icon: "i-heroicons-clipboard-document-list",
      }
    );
  }

  // Supervisor Guide content - visible to Supervisors and Admins
  if (isSupervisor.value || isAdmin.value) {
    content.push(
      {
        id: "sup-transfers",
        section: "Supervisor Guide",
        sectionId: "supervisor-guide",
        targetSection: "transfers",
        title: "Transfer Management",
        content:
          "Review pending transfers by clicking Transfers menu. Filter by Pending Approval status. Approve transfer to move stock immediately between locations. Reject transfer with reason if not appropriate. Transfer workflow: Draft, Pending Approval, Approved or Rejected, Completed.",
        icon: "i-heroicons-clipboard-document-check",
      },
      {
        id: "sup-reconciliations",
        section: "Supervisor Guide",
        sectionId: "supervisor-guide",
        targetSection: "reconciliations",
        title: "Reconciliations",
        content:
          "View reconciliation by clicking Reconciliations menu. Opening stock plus receipts plus transfers in minus transfers out minus issues equals expected closing. Enter adjustments for back charges, credits, condemnations. Mark location ready when reconciliation complete. View consolidated reconciliation for all locations.",
        icon: "i-heroicons-clipboard-document-check",
      },
      {
        id: "sup-manual-ncr",
        section: "Supervisor Guide",
        sectionId: "supervisor-guide",
        targetSection: "ncr",
        title: "Manual NCR Creation",
        content:
          "Create manual NCR for damaged goods, short shipments, quality issues, expired products. Click NCR menu, New NCR, select Manual type. Link to delivery if related. Enter reason and affected items with quantities.",
        icon: "i-heroicons-clipboard-document-check",
      },
      {
        id: "sup-reports",
        section: "Supervisor Guide",
        sectionId: "supervisor-guide",
        targetSection: "reports",
        title: "Reports and Analysis",
        content:
          "Access reports by clicking Reports menu. Stock Now report for current inventory. Deliveries report for delivery history and variances. Issues report for consumption by cost centre. Reconciliation report for period-end summary. Export to CSV for analysis.",
        icon: "i-heroicons-clipboard-document-check",
      }
    );
  }

  // Admin Guide content - visible to Admins only
  if (isAdmin.value) {
    content.push(
      {
        id: "adm-users",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "users",
        title: "User Management",
        content:
          "Manage users by clicking Users menu. Create user with full name, username, email, password. Assign role: Operator, Supervisor, or Admin. Assign locations for Operators. Deactivate users to prevent login while preserving history. Delete users permanently with caution.",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "adm-locations",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "locations",
        title: "Location Management",
        content:
          "Manage locations by clicking Locations menu. Create location with name, code, and type. Location types: Kitchen, Store, Central, Warehouse. Edit or deactivate locations as needed.",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "adm-items",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "items",
        title: "Item Management",
        content:
          "Manage items by clicking Items menu. Create item with code, name, category, unit of measure. Units: KG, EA, LTR, BOX, CASE, PACK. Set minimum stock level for low stock alerts. Avoid changing unit of measure on existing items.",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "adm-suppliers",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "suppliers",
        title: "Supplier Management",
        content:
          "Manage suppliers by clicking Suppliers menu. Create supplier with name, code, contact person, email, phone, payment terms. Edit supplier details as needed.",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "adm-periods",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "periods",
        title: "Period Management",
        content:
          "Manage periods by clicking Periods menu. Period status: Draft, Open, Pending Close, Closed. Set period prices before opening period. Prices lock when period opens. Price variance during delivery creates NCR.",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "adm-period-close",
        section: "Admin Guide",
        sectionId: "admin-guide",
        targetSection: "periodClose",
        title: "Period Close",
        content:
          "Close period by clicking Period Close menu. Pre-close checklist: all deliveries posted, all issues posted, all transfers completed, all reconciliations complete, all locations ready. Click Close Period when all items green. Period close creates closing snapshots, cannot be undone.",
        icon: "i-heroicons-cog-6-tooth",
      }
    );
  }

  return content;
});

// Search function
const performSearch = (query: string) => {
  if (!query.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  const lowerQuery = query.toLowerCase();

  searchResults.value = searchableContent.value.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery)
  );

  isSearching.value = false;
};

// Watch search query with debounce
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    performSearch(newQuery);
  }, 200);
});

// Clear search
const clearSearch = () => {
  searchQuery.value = "";
  searchResults.value = [];
};

// Navigate to search result
const goToResult = (result: SearchResult) => {
  activeSection.value = result.sectionId;
  // Set target section for deep linking to specific subsection
  if (result.targetSection) {
    targetSubSection.value = result.targetSection;
  }
  clearSearch();
};

// Navigation sections based on role
const navSections = computed(() => {
  const sections = [
    {
      id: "getting-started",
      label: "Getting Started",
      icon: "i-heroicons-home",
    },
  ];

  // Add role-specific permissions section
  if (isAdmin.value) {
    sections.push({
      id: "admin-permissions",
      label: "Role & Permissions",
      icon: "i-heroicons-shield-check",
    });
  } else if (isSupervisor.value) {
    sections.push({
      id: "supervisor-permissions",
      label: "Role & Permissions",
      icon: "i-heroicons-shield-check",
    });
  } else if (isOperator.value) {
    sections.push({
      id: "operator-permissions",
      label: "Role & Permissions",
      icon: "i-heroicons-shield-check",
    });
  }

  // Add role-specific guides
  // Admin sees all guides (Admin, Supervisor, Operator)
  // Supervisor sees Supervisor and Operator guides
  // Operator sees only Operator guide
  if (isAdmin.value) {
    sections.push(
      {
        id: "admin-guide",
        label: "Admin Guide",
        icon: "i-heroicons-cog-6-tooth",
      },
      {
        id: "supervisor-guide",
        label: "Supervisor Guide",
        icon: "i-heroicons-clipboard-document-check",
      },
      {
        id: "operator-guide",
        label: "Operator Guide",
        icon: "i-heroicons-clipboard-document-list",
      }
    );
  } else if (isSupervisor.value) {
    sections.push(
      {
        id: "supervisor-guide",
        label: "Supervisor Guide",
        icon: "i-heroicons-clipboard-document-check",
      },
      {
        id: "operator-guide",
        label: "Operator Guide",
        icon: "i-heroicons-clipboard-document-list",
      }
    );
  } else if (isOperator.value) {
    sections.push({
      id: "operator-guide",
      label: "Operator Guide",
      icon: "i-heroicons-clipboard-document-list",
    });
  }

  return sections;
});

// Active section
const activeSection = ref("getting-started");

// Get the role label for display
const roleLabel = computed(() => {
  if (isAdmin.value) return "Admin";
  if (isSupervisor.value) return "Supervisor";
  return "Operator";
});

// Component mapping
const contentComponents: Record<string, Component> = {
  "getting-started": defineAsyncComponent(() => import("~/components/help/GettingStarted.vue")),
  "operator-permissions": defineAsyncComponent(
    () => import("~/components/help/OperatorPermissions.vue")
  ),
  "supervisor-permissions": defineAsyncComponent(
    () => import("~/components/help/SupervisorPermissions.vue")
  ),
  "admin-permissions": defineAsyncComponent(() => import("~/components/help/AdminPermissions.vue")),
  "operator-guide": defineAsyncComponent(() => import("~/components/help/OperatorGuide.vue")),
  "supervisor-guide": defineAsyncComponent(() => import("~/components/help/SupervisorGuide.vue")),
  "admin-guide": defineAsyncComponent(() => import("~/components/help/AdminGuide.vue")),
};

// Get current component
const currentComponent = computed(() => contentComponents[activeSection.value]);

// Handle close
const handleClose = () => {
  emit("update:open", false);
};

// Handle section change
const selectSection = (sectionId: string) => {
  activeSection.value = sectionId;
  // Collapse sidebar on mobile after selection
  if (window.innerWidth < 768) {
    sidebarCollapsed.value = true;
  }
};

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// Keyboard shortcut to close
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    handleClose();
  }
};

// Setup keyboard listener
onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Highlight matching text in search results
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(
    regex,
    '<mark class="bg-[var(--ui-primary)]/20 text-[var(--ui-primary)]">$1</mark>'
  );
};
</script>

<template>
  <USlideover
    :open="props.open"
    side="right"
    :ui="{ content: 'w-full lg:!w-[50vw] !max-w-none' }"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <div class="guide-content flex h-full flex-col bg-[var(--ui-bg)] w-full">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-[var(--ui-border)] px-4 py-3 bg-[var(--ui-bg-elevated)]"
        >
          <div class="flex items-center gap-3">
            <!-- Sidebar Toggle Button -->
            <UButton
              :icon="sidebarCollapsed ? 'i-heroicons-bars-3' : 'i-heroicons-x-mark'"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Toggle sidebar"
              class="cursor-pointer"
              @click="toggleSidebar"
            />
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ui-primary)]/10"
            >
              <UIcon name="i-heroicons-book-open" class="text-lg text-[var(--ui-primary)]" />
            </div>
            <div class="hidden sm:block">
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">Help Center</h2>
              <p class="text-xs text-[var(--ui-text-muted)]">Logged in as {{ roleLabel }}</p>
            </div>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Close help"
            class="cursor-pointer"
            @click="handleClose"
          />
        </div>

        <!-- Search Bar -->
        <div class="px-4 py-3 border-b border-[var(--ui-border)] bg-[var(--ui-bg)]">
          <div class="relative">
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search help topics..."
              class="w-full pl-10 pr-10 py-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent text-sm"
            />
            <UButton
              v-if="searchQuery"
              icon="i-heroicons-x-mark"
              color="neutral"
              variant="ghost"
              size="xs"
              class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Clear search"
              @click="clearSearch"
            />
          </div>

          <!-- Search Results Dropdown -->
          <div
            v-if="searchQuery && searchResults.length > 0"
            class="absolute left-4 right-4 mt-2 max-h-64 overflow-y-auto rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-lg z-50"
          >
            <ul class="divide-y divide-[var(--ui-border)]">
              <li v-for="result in searchResults" :key="result.id">
                <button
                  class="w-full px-4 py-3 text-left hover:bg-[var(--ui-bg-accented)] transition-colors cursor-pointer"
                  @click="goToResult(result)"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon :name="result.icon" class="text-[var(--ui-primary)] text-sm" />
                    <span class="text-xs text-[var(--ui-text-muted)]">{{ result.section }}</span>
                  </div>
                  <p
                    class="text-sm font-medium text-[var(--ui-text-highlighted)]"
                    v-html="highlightMatch(result.title, searchQuery)"
                  />
                  <p
                    class="text-xs text-[var(--ui-text-muted)] line-clamp-2 mt-1"
                    v-html="highlightMatch(result.content.substring(0, 120) + '...', searchQuery)"
                  />
                </button>
              </li>
            </ul>
          </div>

          <!-- No Results -->
          <div
            v-if="searchQuery && searchResults.length === 0 && !isSearching"
            class="absolute left-4 right-4 mt-2 p-4 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] shadow-lg z-50 text-center"
          >
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="text-2xl text-[var(--ui-text-muted)] mb-2"
            />
            <p class="text-sm text-[var(--ui-text-muted)]">
              No results found for "{{ searchQuery }}"
            </p>
          </div>
        </div>

        <!-- Body with sidebar and content -->
        <div class="flex flex-1 overflow-hidden relative">
          <!-- Sidebar Navigation -->
          <nav
            class="shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] overflow-y-auto transition-all duration-300 flex flex-col"
            :class="[
              sidebarCollapsed ? 'w-0 opacity-0 invisible' : 'w-48 opacity-100 visible',
              'absolute md:relative z-40 h-full md:h-auto',
            ]"
          >
            <ul class="p-2 space-y-1 flex-1">
              <li v-for="section in navSections" :key="section.id">
                <button
                  class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                  :class="[
                    activeSection === section.id
                      ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)]'
                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-accented)] hover:text-[var(--ui-text)]',
                  ]"
                  @click="selectSection(section.id)"
                >
                  <UIcon :name="section.icon" class="text-base" />
                  <span>{{ section.label }}</span>
                </button>
              </li>
            </ul>

            <!-- Footer with keyboard hint -->
            <div class="p-3 border-t border-[var(--ui-border)]">
              <p class="text-xs text-[var(--ui-text-dimmed)] text-center">
                Press
                <kbd
                  class="px-1 py-0.5 rounded bg-[var(--ui-bg)] border border-[var(--ui-border)] text-[10px]"
                >
                  Esc
                </kbd>
                to close
              </p>
            </div>
          </nav>

          <!-- Overlay for mobile when sidebar is open -->
          <div
            v-if="!sidebarCollapsed"
            class="md:hidden absolute inset-0 bg-black/20 z-30"
            @click="sidebarCollapsed = true"
          />

          <!-- Content Area -->
          <main class="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense>
              <component :is="currentComponent" />
              <template #fallback>
                <div class="flex items-center justify-center h-32">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="text-2xl text-[var(--ui-text-muted)] animate-spin"
                  />
                </div>
              </template>
            </Suspense>
          </main>
        </div>
      </div>
    </template>
  </USlideover>
</template>
