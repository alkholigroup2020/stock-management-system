/**
 * Composable for tracking testing plan progress
 * Progress is stored in localStorage and persists across login/logout
 * This is NOT tied to user authentication - survives credential changes
 */

// Types
export interface TestingPlanItem {
  id: string;
  label: string;
  description?: string;
}

export interface TestingPlanPhase {
  id: string;
  title: string;
  description?: string;
  items: TestingPlanItem[];
}

export interface TestingPlanData {
  version: string;
  lastUpdated: string;
  title: string;
  description: string;
  phases: TestingPlanPhase[];
}

interface TestingPlanStorageData {
  completedItems: string[];
  lastUpdated: string;
}

// Storage key - NOT user-specific, persists across login/logout
const STORAGE_KEY = "testing-plan-progress";
const PANEL_STATE_KEY = "testing-plan-panel-open";

// Shared state (singleton pattern for SSR compatibility)
const completedItems = ref<Set<string>>(new Set());
const isPanelOpen = ref(false);
const isLargeScreen = ref(true);
const isInitialized = ref(false);

export const useTestingPlanProgress = () => {
  /**
   * Initialize progress from localStorage
   */
  const initializeProgress = (): void => {
    if (!import.meta.client || isInitialized.value) return;

    try {
      // Load completed items
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TestingPlanStorageData = JSON.parse(stored);
        completedItems.value = new Set(parsed.completedItems);
      }

      // Load panel state
      const panelState = localStorage.getItem(PANEL_STATE_KEY);
      if (panelState === "true") {
        isPanelOpen.value = true;
      }

      isInitialized.value = true;
    } catch {
      // Ignore localStorage errors, start fresh
      completedItems.value = new Set();
    }
  };

  /**
   * Persist progress to localStorage
   */
  const persistProgress = (): void => {
    if (!import.meta.client) return;

    try {
      const data: TestingPlanStorageData = {
        completedItems: Array.from(completedItems.value),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore localStorage errors (quota exceeded, etc.)
    }
  };

  /**
   * Persist panel state to localStorage
   */
  const persistPanelState = (): void => {
    if (!import.meta.client) return;

    try {
      localStorage.setItem(PANEL_STATE_KEY, isPanelOpen.value.toString());
    } catch {
      // Ignore localStorage errors
    }
  };

  /**
   * Toggle item completion status
   */
  const toggleItem = (itemId: string): void => {
    if (completedItems.value.has(itemId)) {
      completedItems.value.delete(itemId);
    } else {
      completedItems.value.add(itemId);
    }
    // Trigger reactivity by creating new Set
    completedItems.value = new Set(completedItems.value);
    persistProgress();
  };

  /**
   * Check if an item is completed
   */
  const isItemCompleted = (itemId: string): boolean => {
    return completedItems.value.has(itemId);
  };

  /**
   * Get completion stats for a phase
   */
  const getPhaseProgress = (
    phase: TestingPlanPhase
  ): { completed: number; total: number; percentage: number } => {
    const total = phase.items.length;
    const completed = phase.items.filter((item) => completedItems.value.has(item.id)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  /**
   * Get overall progress across all phases
   */
  const getOverallProgress = (
    phases: TestingPlanPhase[]
  ): { completed: number; total: number; percentage: number } => {
    const total = phases.reduce((sum, phase) => sum + phase.items.length, 0);
    const completed = phases.reduce(
      (sum, phase) => sum + phase.items.filter((item) => completedItems.value.has(item.id)).length,
      0
    );
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  /**
   * Reset all progress
   */
  const resetProgress = (): void => {
    completedItems.value = new Set();
    persistProgress();
  };

  /**
   * Toggle panel visibility
   */
  const togglePanel = (): void => {
    isPanelOpen.value = !isPanelOpen.value;
    persistPanelState();
  };

  /**
   * Open panel
   */
  const openPanel = (): void => {
    isPanelOpen.value = true;
    persistPanelState();
  };

  /**
   * Close panel
   */
  const closePanel = (): void => {
    isPanelOpen.value = false;
    persistPanelState();
  };

  /**
   * Update screen size detection
   */
  const updateScreenSize = (): void => {
    if (import.meta.client) {
      isLargeScreen.value = window.innerWidth >= 1024; // lg breakpoint
    }
  };

  // Lifecycle hooks
  onMounted(() => {
    initializeProgress();
    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
  });

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener("resize", updateScreenSize);
    }
  });

  return {
    // State (readonly for external consumers)
    completedItems: readonly(completedItems),
    isPanelOpen,
    isLargeScreen: readonly(isLargeScreen),

    // Methods
    toggleItem,
    isItemCompleted,
    getPhaseProgress,
    getOverallProgress,
    resetProgress,
    togglePanel,
    openPanel,
    closePanel,
    initializeProgress,
  };
};
