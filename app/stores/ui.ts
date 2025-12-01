import { defineStore } from "pinia";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  timeout?: number;
}

export interface ModalState {
  isOpen: boolean;
  component?: string;
  props?: Record<string, unknown>;
}

export interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toasts: ToastMessage[];
  modals: Record<string, ModalState>;
}

export const useUIStore = defineStore("ui", {
  state: (): UIState => ({
    sidebarCollapsed: false,
    mobileSidebarOpen: false,
    toasts: [],
    modals: {},
  }),

  getters: {
    // Get active toasts
    activeToasts: (state: UIState): ToastMessage[] => {
      return state.toasts;
    },

    // Check if a modal is open
    isModalOpen: (state: UIState) => {
      return (modalId: string): boolean => {
        return state.modals[modalId]?.isOpen || false;
      };
    },
  },

  actions: {
    /**
     * Toggle sidebar collapse state (desktop)
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    /**
     * Set sidebar collapsed state
     */
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed;
    },

    /**
     * Toggle mobile sidebar
     */
    toggleMobileSidebar() {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
    },

    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
      this.mobileSidebarOpen = false;
    },

    /**
     * Add a toast message
     */
    addToast(toast: Omit<ToastMessage, "id">): string {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastMessage = {
        id,
        ...toast,
        timeout: toast.timeout || 5000,
      };

      this.toasts.push(newToast);

      // Auto-remove after timeout
      if (newToast.timeout && newToast.timeout > 0) {
        setTimeout(() => {
          this.removeToast(id);
        }, newToast.timeout);
      }

      return id;
    },

    /**
     * Remove a toast message
     */
    removeToast(id: string) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },

    /**
     * Show success toast
     */
    showSuccess(title: string, description?: string, timeout?: number) {
      return this.addToast({
        type: "success",
        title,
        description,
        timeout,
      });
    },

    /**
     * Show error toast
     */
    showError(title: string, description?: string, timeout?: number) {
      return this.addToast({
        type: "error",
        title,
        description,
        timeout,
      });
    },

    /**
     * Show warning toast
     */
    showWarning(title: string, description?: string, timeout?: number) {
      return this.addToast({
        type: "warning",
        title,
        description,
        timeout,
      });
    },

    /**
     * Show info toast
     */
    showInfo(title: string, description?: string, timeout?: number) {
      return this.addToast({
        type: "info",
        title,
        description,
        timeout,
      });
    },

    /**
     * Open a modal
     */
    openModal(modalId: string, component?: string, props?: Record<string, unknown>) {
      this.modals[modalId] = {
        isOpen: true,
        component,
        props,
      };
    },

    /**
     * Close a modal
     */
    closeModal(modalId: string) {
      if (this.modals[modalId]) {
        this.modals[modalId].isOpen = false;
      }
    },

    /**
     * Reset store state
     */
    reset() {
      this.sidebarCollapsed = false;
      this.mobileSidebarOpen = false;
      this.toasts = [];
      this.modals = {};
    },
  },
});
