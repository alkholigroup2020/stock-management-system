/**
 * Shared API Type Definitions
 * Types for API request/response payloads across the application
 */

// Location deletion response
export interface LocationDeleteResponse {
  success: boolean;
  deleted: boolean; // true = hard delete (permanent removal)
  deactivated: boolean; // true = soft delete (is_active = false)
  message: string;
  location?: {
    id: string;
    name: string;
    is_active: boolean;
  };
  reassignedUsers?: number; // Count of users whose default_location was cleared
}
