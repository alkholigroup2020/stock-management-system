<template>
  <div class="dev-guide-page">
    <!-- Dynamic section component will be rendered here -->
    <component :is="currentComponent" v-if="currentComponent" />
    <div v-else class="p-8">
      <UAlert
        title="Section Not Found"
        description="The requested documentation section could not be found."
        color="error"
        icon="i-heroicons-exclamation-triangle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import DeveloperGettingStartedDev from "~/components/developer/GettingStartedDev.vue";
import DeveloperArchitectureOverview from "~/components/developer/ArchitectureOverview.vue";
import DeveloperAuthenticationGuide from "~/components/developer/AuthenticationGuide.vue";
import DeveloperDatabaseGuide from "~/components/developer/DatabaseGuide.vue";
import DeveloperStateManagementGuide from "~/components/developer/StateManagementGuide.vue";
import DeveloperCachingSystemGuide from "~/components/developer/CachingSystemGuide.vue";
import DeveloperMultiLocationGuide from "~/components/developer/MultiLocationGuide.vue";
import DeveloperDeliveriesWACGuide from "~/components/developer/DeliveriesWACGuide.vue";
import DeveloperIssuesGuide from "~/components/developer/IssuesGuide.vue";
import DeveloperTransfersGuide from "~/components/developer/TransfersGuide.vue";
import DeveloperItemsManagementGuide from "~/components/developer/ItemsManagementGuide.vue";
import DeveloperNCRGuide from "~/components/developer/NCRGuide.vue";
import DeveloperReconciliationGuide from "~/components/developer/ReconciliationGuide.vue";
import DeveloperPeriodManagementGuide from "~/components/developer/PeriodManagementGuide.vue";
import DeveloperPOBGuide from "~/components/developer/POBGuide.vue";
import DeveloperDataFetchingComposablesGuide from "~/components/developer/DataFetchingComposablesGuide.vue";
import DeveloperServerApiPatternsGuide from "~/components/developer/ServerApiPatternsGuide.vue";
import DeveloperFormsValidationGuide from "~/components/developer/FormsValidationGuide.vue";
import DeveloperComponentPatternsGuide from "~/components/developer/ComponentPatternsGuide.vue";
import DeveloperTablesListsGuide from "~/components/developer/TablesListsGuide.vue";
import DeveloperErrorHandlingGuide from "~/components/developer/ErrorHandlingGuide.vue";

definePageMeta({
  middleware: ["dev-only"],
  layout: "docs",
});

const { activeSection } = useDevGuideNav();

// Provide targetSection for subsection deep linking (used by guide components)
const route = useRoute();
const devTargetSection = computed(() => {
  const slug = route.params.slug as string[] | undefined;
  return slug?.[1] || null;
});

provide("devTargetSection", devTargetSection);

// Component mapping with explicit imports
const componentMap: Record<string, Component> = {
  "getting-started": DeveloperGettingStartedDev,
  architecture: DeveloperArchitectureOverview,
  authentication: DeveloperAuthenticationGuide,
  database: DeveloperDatabaseGuide,
  "state-management": DeveloperStateManagementGuide,
  "caching-system": DeveloperCachingSystemGuide,
  "multi-location": DeveloperMultiLocationGuide,
  "deliveries-wac": DeveloperDeliveriesWACGuide,
  issues: DeveloperIssuesGuide,
  transfers: DeveloperTransfersGuide,
  "items-management": DeveloperItemsManagementGuide,
  ncr: DeveloperNCRGuide,
  reconciliation: DeveloperReconciliationGuide,
  "period-management": DeveloperPeriodManagementGuide,
  pob: DeveloperPOBGuide,
  "data-fetching": DeveloperDataFetchingComposablesGuide,
  "server-api": DeveloperServerApiPatternsGuide,
  "forms-validation": DeveloperFormsValidationGuide,
  "component-patterns": DeveloperComponentPatternsGuide,
  "tables-lists": DeveloperTablesListsGuide,
  "error-handling": DeveloperErrorHandlingGuide,
};

// Find the current section's component
const currentComponent = computed(() => {
  return componentMap[activeSection.value] || null;
});
</script>
