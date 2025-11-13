import { defineStore } from "pinia";
import type { Period } from "@prisma/client";

export interface PeriodState {
  currentPeriod: Period | null;
  loading: boolean;
  error: string | null;
}

export const usePeriodStore = defineStore("period", {
  state: (): PeriodState => ({
    currentPeriod: null,
    loading: false,
    error: null,
  }),

  getters: {
    // Check if there's an active period
    hasPeriod: (state: PeriodState): boolean => {
      return state.currentPeriod !== null;
    },

    // Check if current period is open
    isPeriodOpen: (state: PeriodState): boolean => {
      return state.currentPeriod?.status === "OPEN";
    },

    // Get period name
    periodName: (state: PeriodState): string => {
      return state.currentPeriod?.name || "No Period";
    },

    // Get period status
    periodStatus: (state: PeriodState): string => {
      return state.currentPeriod?.status || "UNKNOWN";
    },

    // Get formatted period date range
    periodDateRange: (state: PeriodState): string => {
      if (!state.currentPeriod) return "";

      const startDate = new Date(state.currentPeriod.start_date);
      const endDate = new Date(state.currentPeriod.end_date);

      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    },

    // Get days remaining in period
    daysRemaining: (state: PeriodState): number => {
      if (!state.currentPeriod) return 0;

      const endDate = new Date(state.currentPeriod.end_date);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    },
  },

  actions: {
    /**
     * Fetch the current active period
     */
    async fetchCurrentPeriod() {
      this.loading = true;
      this.error = null;

      try {
        const response = await $fetch<{ period: Period | null }>(
          "/api/periods/current",
          {
            method: "GET",
          }
        );

        this.currentPeriod = response.period;
      } catch (err: any) {
        this.error = err?.data?.message || "Failed to fetch current period";
        console.error("Error fetching current period:", err);
        this.currentPeriod = null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Refresh period data
     */
    async refresh() {
      await this.fetchCurrentPeriod();
    },

    /**
     * Clear error
     */
    clearError() {
      this.error = null;
    },

    /**
     * Reset store state
     */
    reset() {
      this.currentPeriod = null;
      this.loading = false;
      this.error = null;
    },
  },
});
