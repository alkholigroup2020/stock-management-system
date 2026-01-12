<script setup lang="ts">
import type { Ref } from "vue";

const expandedSections = ref<string[]>([]);

const toggleSection = (section: string) => {
  if (expandedSections.value.includes(section)) {
    expandedSections.value = [];
  } else {
    expandedSections.value = [section];
  }
};

const isExpanded = (section: string) => expandedSections.value.includes(section);

const targetSubSection = inject<Ref<string | null>>("devTargetSection", ref(null));

watch(
  targetSubSection,
  (newSection) => {
    if (newSection) {
      if (!expandedSections.value.includes(newSection)) {
        expandedSections.value.push(newSection);
      }
      nextTick(() => {
        const element = document.getElementById(`dev-section-${newSection}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (targetSubSection.value) {
          targetSubSection.value = null;
        }
      });
    }
  },
  { immediate: true }
);

// Code examples
const codeExamples = {
  authStack: `// Authentication Stack
// - nuxt-auth-utils: Session management with JWT in httpOnly cookies
// - Pinia auth store: Client-side state management
// - Server middleware: API route protection
// - Client middleware: Page route protection`,

  loginUsage: `const { login, isAuthenticated, error } = useAuth();

const handleLogin = async () => {
  const result = await login(email.value, password.value);
  if (result.success) {
    toast.showSuccess("Login successful");
    await navigateTo("/");
  } else {
    toast.showError(result.message || "Login failed");
  }
};`,

  loginServer: `// Server: /server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  // Find user by email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: email.toLowerCase() }
      ],
      is_active: true
    }
  });

  // Verify password with bcrypt
  const isValid = await verifyUserPassword(password, user.password_hash);

  // Create session (httpOnly cookie)
  await setUserSession(event, { user: sessionUser });

  return { success: true, user: sessionUser };
});`,

  logoutUsage: `// Logout from anywhere in the app
const { logout } = useAuth();

const handleLogout = async () => {
  await logout();
  await navigateTo("/login");
};`,

  logoutServer: `// Server: /server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  // Clears httpOnly session cookie
  await clearUserSession(event);
  return { success: true, message: "Logout successful" };
});`,

  useAuthApi: `const {
  // State
  user,              // Current user object (reactive)
  isAuthenticated,   // Boolean - is logged in?
  loading,           // Boolean - operation in progress?
  error,             // String - error message

  // Role checks (computed)
  role,              // "OPERATOR" | "SUPERVISOR" | "ADMIN"
  isAdmin,           // Boolean
  isSupervisor,      // Boolean
  isOperator,        // Boolean
  isAtLeastSupervisor, // Boolean (Supervisor or Admin)

  // Role methods
  hasRole(role),           // Check specific role
  hasAnyRole(roles[]),     // Check if user has any of the roles

  // Location access
  hasLocationAccess(locationId),   // Can access location?
  canPostAtLocation(locationId),   // Can post transactions?
  canManageLocation(locationId),   // Can manage location?
  getAccessibleLocationIds(),      // Get all accessible location IDs

  // Auth actions
  login(email, password),  // Returns { success, message? }
  logout(),                // Returns { success, message? }
  fetchSession(),          // Refresh session from server
  clearError(),            // Clear error message

  // Permission shortcuts
  canApproveTransfers,     // Supervisor+ only
  canClosePeriods,         // Admin only
  canManageItems,          // Admin only
  canManageUsers,          // Admin only
  canEditReconciliations,  // Supervisor+ only
  canPostDeliveries(locationId),  // Has location access
  canPostIssues(locationId),      // Has location access
} = useAuth();`,

  roleChecks: `// Role checking examples
const { isAdmin, isSupervisor, hasRole, hasAnyRole } = useAuth();

// Simple role checks
if (isAdmin.value) {
  // Admin-only functionality
}

// Flexible role checks
if (hasAnyRole(["ADMIN", "SUPERVISOR"])) {
  // Manager functionality
}

// Specific role check
if (hasRole("OPERATOR")) {
  // Operator-specific UI
}`,

  locationAccess: `// Location access checking
const { hasLocationAccess, canPostAtLocation } = useAuth();

// Check if user can access a location
if (hasLocationAccess(locationId)) {
  // User can view this location's data
}

// Check if user can post transactions
if (canPostAtLocation(locationId)) {
  // User can create deliveries/issues here
}

// Note: Admin and Supervisor roles have implicit
// access to ALL locations`,

  authGlobalMiddleware: `// /app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth();

  // Public routes (no auth required)
  const publicRoutes = ["/login"];

  if (!isAuthenticated.value && !publicRoutes.includes(to.path)) {
    // Redirect to login with return URL
    return navigateTo(\`/login?redirect=\${encodeURIComponent(to.fullPath)}\`);
  }

  if (isAuthenticated.value && to.path === "/login") {
    // Already logged in, go to dashboard
    return navigateTo("/");
  }
});`,

  roleMiddleware: `// Using role middleware on pages
definePageMeta({
  middleware: ["role"],
  roleRequired: "ADMIN"  // Single role
});

// Or multiple roles
definePageMeta({
  middleware: ["role"],
  roleRequired: ["ADMIN", "SUPERVISOR"]  // Either role
});

// Or minimum role level
definePageMeta({
  middleware: ["role"],
  minRole: "SUPERVISOR"  // SUPERVISOR or ADMIN can access
});

// Role hierarchy: OPERATOR (1) < SUPERVISOR (2) < ADMIN (3)`,

  serverMiddleware: `// /server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/session",
    "/api/health"
  ];

  if (publicRoutes.some((r) => event.path.startsWith(r))) {
    return; // No auth required
  }

  // Check session
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized"
    });
  }

  // Attach user to event context
  event.context.user = session.user;
});`,

  serverUserAccess: `// Accessing user in server routes
export default defineEventHandler(async (event) => {
  // User is set by auth middleware
  const user = event.context.user;

  // Check role
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access required"
    });
  }

  // Check location access (for operators)
  if (user.role === "OPERATOR") {
    const hasAccess = user.locations.includes(locationId);
    if (!hasAccess) {
      throw createError({
        statusCode: 403,
        data: { code: "LOCATION_ACCESS_DENIED" }
      });
    }
  }
});`,

  rolesTable: `// Role Permissions Summary
// ┌─────────────────────┬──────────┬────────────┬─────────┐
// │ Permission          │ OPERATOR │ SUPERVISOR │ ADMIN   │
// ├─────────────────────┼──────────┼────────────┼─────────┤
// │ Post Deliveries     │    ✓*    │     ✓      │    ✓    │
// │ Post Issues         │    ✓*    │     ✓      │    ✓    │
// │ Create Transfers    │    ✓*    │     ✓      │    ✓    │
// │ Approve Transfers   │    ✗     │     ✓      │    ✓    │
// │ View Stock          │    ✓*    │     ✓      │    ✓    │
// │ Manage Reconcile    │    ✗     │     ✓      │    ✓    │
// │ Manage Items        │    ✗     │     ✗      │    ✓    │
// │ Manage Users        │    ✗     │     ✗      │    ✓    │
// │ Manage Locations    │    ✗     │     ✗      │    ✓    │
// │ Close Periods       │    ✗     │     ✗      │    ✓    │
// └─────────────────────┴──────────┴────────────┴─────────┘
// * = Restricted to assigned locations only`,

  passwordRequirements: `// Password Requirements (validated on both client & server)
// - Minimum 8 characters
// - At least one uppercase letter (A-Z)
// - At least one lowercase letter (a-z)
// - At least one number (0-9)
// - At least one special character (@$!%*?&)

// Server validation with Zod
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number")
  .regex(/[@$!%*?&]/, "Must contain special character");`,

  passwordValidation: `// Server utility: /server/utils/auth.ts
import bcrypt from "bcrypt";

// Hash password (10 salt rounds)
export const hashUserPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

// Verify password
export const verifyUserPassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

// Check password strength
export const validatePasswordStrength = (password: string) => {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Min 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Need uppercase");
  if (!/[a-z]/.test(password)) errors.push("Need lowercase");
  if (!/[0-9]/.test(password)) errors.push("Need number");
  if (!/[@$!%*?&]/.test(password)) errors.push("Need special char");

  return {
    valid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? "strong" :
              errors.length <= 2 ? "medium" : "weak"
  };
};`,

  appInit: `// /app/plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const appInit = useAppInit();

  // Initialize app (fetches session, locations, period)
  await appInit.initialize();
});`,

  appInitSequence: `// /app/composables/useAppInit.ts
// Initialization sequence:
// 1. Fetch auth session from server
// 2. If authenticated:
//    - Fetch user's accessible locations
//    - Fetch current open period
// 3. Mark app as ready

const { initialize, isReady, isInitializing } = useAppInit();

// In app.vue or layout
<template>
  <LoadingScreen v-if="!isReady" />
  <NuxtPage v-else />
</template>`,

  postLoginLoading: `// Post-login data loading (in auth store)
async login(email, password) {
  const response = await $fetch("/api/auth/login", {
    method: "POST",
    body: { email, password }
  });

  if (response.success) {
    this.user = response.user;

    // Show loading screen during data fetch
    useAppInit().setLoadingForPostLogin();

    // Fetch essential data in parallel
    await Promise.all([
      useLocationStore().fetchUserLocations(),
      usePeriodStore().fetchCurrentPeriod()
    ]);

    // Ready to show dashboard
    useAppInit().setReadyAfterPostLogin();
  }
}`,
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="border-b border-[var(--ui-border)] pb-4">
      <h2 class="text-2xl font-bold text-[var(--ui-text-highlighted)]">Authentication Guide</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
        Login, logout, session management, and role-based access control
      </p>
    </div>

    <!-- Overview Section -->
    <section
      id="dev-section-overview"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('overview')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-lock-closed" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">
            Authentication Overview
          </span>
        </span>
        <UIcon
          :name="isExpanded('overview') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('overview')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The authentication system uses
          <strong>nuxt-auth-utils</strong>
          for session management with JWT tokens stored in httpOnly cookies for security.
        </p>

        <DeveloperCodeBlock :code="codeExamples.authStack" language="typescript" />

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Key Components</h4>
          <ul class="space-y-2 text-sm text-[var(--ui-text-muted)]">
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>httpOnly Cookies:</strong>
                JWT tokens stored securely, not accessible via JavaScript (XSS protection)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Pinia Auth Store:</strong>
                Client-side state with user info, role, and permissions
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Server Middleware:</strong>
                Protects all /api/* routes (except auth endpoints)
              </span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon name="i-heroicons-check-circle" class="mt-0.5 text-[var(--ui-success)]" />
              <span>
                <strong>Client Middleware:</strong>
                Redirects unauthenticated users to login page
              </span>
            </li>
          </ul>
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              There is no frontend registration page. Only Admins can create new users via the API.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Login Flow Section -->
    <section
      id="dev-section-login-flow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('login-flow')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-arrow-right-on-rectangle"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Login Flow</span>
        </span>
        <UIcon
          :name="isExpanded('login-flow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('login-flow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The login flow involves both client and server components working together.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Client-Side Login</h4>
          <DeveloperCodeBlock
            :code="codeExamples.loginUsage"
            language="typescript"
            filename="app/pages/login.vue"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Server-Side Login Handler
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.loginServer"
            language="typescript"
            filename="server/api/auth/login.post.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Login Sequence</h4>
          <ol class="list-inside list-decimal space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>User enters email/username and password on login page</li>
            <li>
              Client calls
              <code class="code-inline">useAuth().login()</code>
            </li>
            <li>Server verifies credentials with bcrypt</li>
            <li>
              Server creates session with
              <code class="code-inline">setUserSession()</code>
            </li>
            <li>Client receives user data, stores in Pinia</li>
            <li>App fetches locations and current period</li>
            <li>User redirected to dashboard (or original URL)</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- Logout Flow Section -->
    <section
      id="dev-section-logout-flow"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('logout-flow')"
      >
        <span class="flex items-center gap-3">
          <UIcon
            name="i-heroicons-arrow-left-on-rectangle"
            class="text-xl text-[var(--ui-primary)]"
          />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Logout Flow</span>
        </span>
        <UIcon
          :name="isExpanded('logout-flow') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('logout-flow')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Logout clears the session on both server and client, resetting all stores.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Client-Side Logout</h4>
          <DeveloperCodeBlock :code="codeExamples.logoutUsage" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Server-Side Logout Handler
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.logoutServer"
            language="typescript"
            filename="server/api/auth/logout.post.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Logout Sequence</h4>
          <ol class="list-inside list-decimal space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>User clicks logout (in navbar dropdown)</li>
            <li>
              Client calls
              <code class="code-inline">useAuth().logout()</code>
            </li>
            <li>Server clears httpOnly session cookie</li>
            <li>Client resets auth store (user = null)</li>
            <li>Client resets location and period stores</li>
            <li>App re-initializes, showing login page</li>
          </ol>
        </div>
      </div>
    </section>

    <!-- useAuth Composable Section -->
    <section
      id="dev-section-useauth-composable"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('useauth-composable')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-finger-print" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">useAuth Composable</span>
        </span>
        <UIcon
          :name="
            isExpanded('useauth-composable') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('useauth-composable')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The main authentication composable providing state, role checks, and actions.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Full API Reference</h4>
          <DeveloperCodeBlock
            :code="codeExamples.useAuthApi"
            language="typescript"
            filename="app/composables/useAuth.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Role Checking Examples</h4>
          <DeveloperCodeBlock :code="codeExamples.roleChecks" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Location Access</h4>
          <DeveloperCodeBlock :code="codeExamples.locationAccess" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Middleware Section -->
    <section
      id="dev-section-middleware"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('middleware')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-shield-check" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Route Protection</span>
        </span>
        <UIcon
          :name="isExpanded('middleware') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('middleware')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Three layers of protection: client middleware, server middleware, and role middleware.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Client Auth Middleware (Global)
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.authGlobalMiddleware"
            language="typescript"
            filename="app/middleware/auth.global.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Role-Based Page Protection
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.roleMiddleware"
            language="typescript"
            filename="app/middleware/role.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Server API Middleware</h4>
          <DeveloperCodeBlock
            :code="codeExamples.serverMiddleware"
            language="typescript"
            filename="server/middleware/auth.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Accessing User in Server Routes
          </h4>
          <DeveloperCodeBlock :code="codeExamples.serverUserAccess" language="typescript" />
        </div>
      </div>
    </section>

    <!-- Roles & Permissions Section -->
    <section
      id="dev-section-roles-permissions"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('roles-permissions')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-user-group" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Roles & Permissions</span>
        </span>
        <UIcon
          :name="
            isExpanded('roles-permissions') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('roles-permissions')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Three roles with hierarchical permissions: OPERATOR &lt; SUPERVISOR &lt; ADMIN
        </p>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">Role Descriptions</h4>
          <div class="space-y-2">
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="info" variant="soft">OPERATOR</UBadge>
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Basic Operations
                </span>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Can post deliveries, issues, and create transfer requests at assigned locations
                only.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="warning" variant="soft">SUPERVISOR</UBadge>
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Approvals & Oversight
                </span>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Can approve transfers, manage reconciliations, access all locations. Cannot manage
                system settings.
              </p>
            </div>
            <div class="rounded-lg border border-[var(--ui-border)] p-3">
              <div class="flex items-center gap-2">
                <UBadge color="error" variant="soft">ADMIN</UBadge>
                <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                  Full System Access
                </span>
              </div>
              <p class="mt-1 text-sm text-[var(--ui-text-muted)]">
                Can manage users, items, locations, suppliers, close periods. Has all permissions.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Permissions Matrix</h4>
          <DeveloperCodeBlock :code="codeExamples.rolesTable" language="plaintext" />
        </div>

        <div class="rounded-lg border border-[var(--ui-warning)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-warning)]">
            <UIcon name="i-heroicons-exclamation-triangle" class="mt-0.5 shrink-0" />
            <span>
              <strong>Important:</strong>
              Operators are restricted to their assigned locations. Admin and Supervisor have
              implicit access to all locations.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Password Security Section -->
    <section
      id="dev-section-password-security"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('password-security')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-key" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">Password Security</span>
        </span>
        <UIcon
          :name="
            isExpanded('password-security') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('password-security')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          Passwords are hashed with bcrypt and validated on both client and server.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Password Requirements</h4>
          <DeveloperCodeBlock :code="codeExamples.passwordRequirements" language="typescript" />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Server Utilities</h4>
          <DeveloperCodeBlock
            :code="codeExamples.passwordValidation"
            language="typescript"
            filename="server/utils/auth.ts"
          />
        </div>

        <div class="rounded-lg border border-[var(--ui-info)]/30 bg-[var(--ui-bg)] p-3">
          <p class="flex items-start gap-2 text-sm text-[var(--ui-info)]">
            <UIcon name="i-heroicons-information-circle" class="mt-0.5 shrink-0" />
            <span>
              bcrypt with 10 salt rounds provides a good balance of security and performance.
              Password hashes are never exposed to the client.
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- App Initialization Section -->
    <section
      id="dev-section-app-initialization"
      class="overflow-hidden rounded-lg border border-[var(--ui-border)]"
    >
      <button
        class="flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]"
        @click="toggleSection('app-initialization')"
      >
        <span class="flex items-center gap-3">
          <UIcon name="i-heroicons-play" class="text-xl text-[var(--ui-primary)]" />
          <span class="font-semibold text-[var(--ui-text-highlighted)]">App Initialization</span>
        </span>
        <UIcon
          :name="
            isExpanded('app-initialization') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          class="text-[var(--ui-text-muted)]"
        />
      </button>
      <div v-if="isExpanded('app-initialization')" class="space-y-4 p-4">
        <p class="text-sm text-[var(--ui-text-muted)]">
          The app initialization coordinates auth, location, and period data loading.
        </p>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Auth Plugin</h4>
          <DeveloperCodeBlock
            :code="codeExamples.appInit"
            language="typescript"
            filename="app/plugins/auth.client.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">
            Initialization Sequence
          </h4>
          <DeveloperCodeBlock
            :code="codeExamples.appInitSequence"
            language="typescript"
            filename="app/composables/useAppInit.ts"
          />
        </div>

        <div>
          <h4 class="mb-2 font-medium text-[var(--ui-text-highlighted)]">Post-Login Loading</h4>
          <DeveloperCodeBlock
            :code="codeExamples.postLoginLoading"
            language="typescript"
            filename="app/stores/auth.ts"
          />
        </div>

        <div class="space-y-3">
          <h4 class="font-medium text-[var(--ui-text-highlighted)]">State Flags</h4>
          <ul class="space-y-1 text-sm text-[var(--ui-text-muted)]">
            <li>
              <code class="code-inline">isInitializing</code>
              - Currently loading essential data
            </li>
            <li>
              <code class="code-inline">isReady</code>
              - Safe to render pages (all data loaded)
            </li>
            <li>
              <code class="code-inline">authLoaded</code>
              - Session fetch completed
            </li>
            <li>
              <code class="code-inline">locationsLoaded</code>
              - User locations fetched
            </li>
            <li>
              <code class="code-inline">periodLoaded</code>
              - Current period fetched
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.code-inline {
  @apply rounded bg-[var(--ui-bg-muted)] px-1.5 py-0.5 font-mono text-xs;
}
</style>
