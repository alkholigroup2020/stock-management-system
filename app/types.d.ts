/**
 * Type augmentations for the Stock Management System
 *
 * This file extends Nuxt and Vue Router types to support custom properties
 * used throughout the application.
 */

import type { UserRole } from "~~/shared/types/database";

declare module "#app" {
  interface PageMeta {
    /**
     * Specific role(s) required to access this page
     * @example 'ADMIN'
     * @example ['ADMIN', 'SUPERVISOR']
     */
    roleRequired?: UserRole | UserRole[];

    /**
     * Minimum role level required to access this page
     * Users with this role or higher can access
     * @example 'SUPERVISOR' // SUPERVISOR and ADMIN can access
     */
    minRole?: UserRole;
  }
}

declare module "vue-router" {
  interface RouteMeta {
    /**
     * Specific role(s) required to access this route
     */
    roleRequired?: UserRole | UserRole[];

    /**
     * Minimum role level required to access this route
     */
    minRole?: UserRole;
  }
}

export {};
