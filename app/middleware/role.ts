/**
 * Role-Based Authorization Middleware
 *
 * Use this middleware on specific pages to restrict access based on user roles.
 *
 * Usage in page component:
 * ```ts
 * definePageMeta({
 *   middleware: ['role'],
 *   roleRequired: 'ADMIN' // or ['ADMIN', 'SUPERVISOR']
 * })
 * ```
 *
 * Or for minimum role level:
 * ```ts
 * definePageMeta({
 *   middleware: ['role'],
 *   minRole: 'SUPERVISOR' // SUPERVISOR or ADMIN can access
 * })
 * ```
 */

import type { UserRole } from '@prisma/client'

// Define role hierarchy (higher number = more privileges)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  OPERATOR: 1,
  SUPERVISOR: 2,
  ADMIN: 3
}

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth()

  // If user is not authenticated, let auth.global.ts handle the redirect
  if (!auth.isAuthenticated.value) {
    return
  }

  // Get role requirements from page meta
  const roleRequired = to.meta.roleRequired as UserRole | UserRole[] | undefined
  const minRole = to.meta.minRole as UserRole | undefined

  // If no role requirement is specified, allow access
  if (!roleRequired && !minRole) {
    return
  }

  const userRole = auth.role.value

  // Check if user has the required role(s)
  if (roleRequired) {
    const requiredRoles = Array.isArray(roleRequired) ? roleRequired : [roleRequired]
    const hasRequiredRole = requiredRoles.some((role) => userRole === role)

    if (!hasRequiredRole) {
      return abortNavigation({
        statusCode: 403,
        statusMessage: `Access denied. Required role: ${requiredRoles.join(' or ')}`
      })
    }
  }

  // Check if user meets minimum role level
  if (minRole) {
    const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
    const minRoleLevel = ROLE_HIERARCHY[minRole] || 0

    if (userRoleLevel < minRoleLevel) {
      return abortNavigation({
        statusCode: 403,
        statusMessage: `Access denied. Minimum role required: ${minRole}`
      })
    }
  }
})
