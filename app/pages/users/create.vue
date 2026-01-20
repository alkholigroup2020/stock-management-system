<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import { z } from "zod";
import type { UserRole } from "~~/shared/types/database";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
  layout: "default",
});

// Composables
const toast = useAppToast();

// State
const submitting = ref(false);
const locations = ref<Array<{ id: string; code: string; name: string; type: string }>>([]);
const isCancelModalOpen = ref(false);

// Form schema
const schema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)"
      ),
    confirm_password: z.string(),
    full_name: z.string().min(1, "Full name is required").max(100),
    role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN", "PROCUREMENT_SPECIALIST"]),
    default_location_id: z.string().uuid("Invalid location").optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type Schema = z.output<typeof schema>;

// Form data
const formData = reactive({
  username: "",
  email: "",
  password: "",
  confirm_password: "",
  full_name: "",
  role: "OPERATOR" as UserRole,
  default_location_id: undefined as string | undefined,
});

// Role options - with location access info
const roleOptions = [
  {
    value: "OPERATOR",
    label: "Operator",
    description: "Post transactions at assigned locations only",
  },
  {
    value: "PROCUREMENT_SPECIALIST",
    label: "Procurement Specialist",
    description: "Limited access - manage POs and view deliveries only",
  },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "All locations access - approve transfers & reconciliations",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full system access - all locations with complete control",
  },
];

// Check if selected role requires location assignment
const isOperatorRole = computed(() => formData.role === "OPERATOR");
const isProcurementSpecialistRole = computed(() => formData.role === "PROCUREMENT_SPECIALIST");

// Location options
const locationOptions = computed(() => [
  { value: undefined, label: "None (Optional)" },
  ...locations.value.map((l) => ({
    value: l.id,
    label: `${l.code} - ${l.name}`,
  })),
]);

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await $fetch<{ locations: typeof locations.value }>("/api/locations");
    locations.value = response.locations;
  } catch (err: unknown) {
    console.error("Error fetching locations:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to load locations";
    toast.error("Error", { description: message });
  }
};

// Submit handler
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  submitting.value = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirm_password, ...userData } = event.data;

    await $fetch("/api/auth/register", {
      method: "POST",
      body: userData,
    });

    const successMessage = formData.default_location_id
      ? "User created successfully with access to default location"
      : "User created successfully";
    toast.success("Success", { description: successMessage });
    await navigateTo("/users");
  } catch (err: unknown) {
    console.error("Error creating user:", err);
    const message =
      err &&
      typeof err === "object" &&
      "data" in err &&
      err.data &&
      typeof err.data === "object" &&
      "message" in err.data
        ? String(err.data.message)
        : "Failed to create user";
    toast.error("Error", { description: message });
  } finally {
    submitting.value = false;
  }
};

// Check if form has any data
const hasFormData = computed(() => {
  return (
    formData.username ||
    formData.email ||
    formData.password ||
    formData.confirm_password ||
    formData.full_name ||
    formData.role !== "OPERATOR" ||
    formData.default_location_id
  );
});

// Handle cancel - show modal if there's unsaved data
const handleCancel = () => {
  if (hasFormData.value) {
    isCancelModalOpen.value = true;
  } else {
    navigateTo("/users");
  }
};

// Confirm cancel and navigate away
const confirmCancel = () => {
  isCancelModalOpen.value = false;
  navigateTo("/users");
};

// Load locations on mount
onMounted(() => {
  fetchLocations();
});

// Set page title
useHead({
  title: "Create User - Stock Management System",
});
</script>

<template>
  <div class="px-0 py-0 md:px-4 md:py-1 space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between gap-3">
      <!-- Title with icon -->
      <div class="flex items-center gap-2 sm:gap-4">
        <UIcon name="i-lucide-user-plus" class="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
        <div>
          <h1 class="text-xl sm:text-3xl font-bold text-primary">Create User</h1>
          <p class="hidden sm:block text-sm text-[var(--ui-text-muted)] mt-1">
            Add a new user account to the system
          </p>
        </div>
      </div>
      <!-- Back button -->
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-arrow-left"
        size="lg"
        class="cursor-pointer rounded-full px-3 sm:px-6"
        @click="handleCancel"
      >
        <span class="hidden sm:inline">Back</span>
      </UButton>
    </div>

    <!-- Form Container -->
    <div>
      <UForm :schema="schema" :state="formData" @submit="onSubmit">
        <!-- Account Information Section -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Account Information
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Username -->
            <UFormField
              label="Username"
              name="username"
              required
              help="Unique username for system login"
            >
              <UInput
                v-model="formData.username"
                placeholder="e.g., john.doe"
                icon="i-lucide-at-sign"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Email -->
            <UFormField label="Email Address" name="email" required help="User's email address">
              <UInput
                v-model="formData.email"
                type="email"
                placeholder="e.g., john@example.com"
                icon="i-lucide-mail"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Password -->
            <UFormField
              label="Password"
              name="password"
              required
              help="Must meet requirements below"
            >
              <UInput
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <!-- Confirm Password -->
            <UFormField
              label="Confirm Password"
              name="confirm_password"
              required
              help="Re-enter password to confirm"
            >
              <UInput
                v-model="formData.confirm_password"
                type="password"
                placeholder="••••••••"
                icon="i-lucide-lock"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Personal Information Section -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Personal Information
              </h2>
            </div>
          </template>

          <!-- Single field at 50% width on large screens -->
          <div class="space-y-6">
            <UFormField
              label="Full Name"
              name="full_name"
              required
              help="User's full display name"
              class="w-full lg:w-1/2"
            >
              <UInput
                v-model="formData.full_name"
                placeholder="e.g., John Doe"
                icon="i-lucide-user-circle"
                size="lg"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Role & Permissions Section -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Role & Permissions
              </h2>
            </div>
          </template>

          <!-- Responsive Grid: 1 column on mobile, 2 columns on lg+ screens -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- User Role -->
            <UFormField label="User Role" name="role" required help="Determines system permissions">
              <USelectMenu
                v-model="formData.role"
                :items="roleOptions"
                value-key="value"
                placeholder="Select role"
                size="lg"
                :disabled="submitting"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-lucide-user-cog" class="w-4 h-4" />
                </template>
              </USelectMenu>
            </UFormField>

            <!-- Default Location -->
            <UFormField
              label="Default Location"
              name="default_location_id"
              :help="
                isOperatorRole || isProcurementSpecialistRole
                  ? 'User will automatically receive access to this location'
                  : 'Optional: User\'s default working location (preference only)'
              "
            >
              <USelectMenu
                v-model="formData.default_location_id"
                :items="locationOptions"
                value-key="value"
                placeholder="Select default location (optional)"
                size="lg"
                :disabled="submitting"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4" />
                </template>
              </USelectMenu>
            </UFormField>
          </div>

          <!-- Role-based Location Access Info -->
          <div class="mt-6">
            <!-- OPERATOR: Needs location assignment -->
            <div v-if="isOperatorRole" class="p-4 rounded-lg bg-primary/10 border border-primary">
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-info" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p class="font-semibold text-primary mb-1">Location Assignment Required</p>
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <strong>Operators</strong>
                    can only access their assigned locations. After creating this user, you will
                    need to assign specific locations on the user's edit page. If you select a
                    Default Location above, it will be automatically assigned with POST access.
                  </p>
                </div>
              </div>
            </div>

            <!-- PROCUREMENT_SPECIALIST: Limited access, can view deliveries -->
            <div
              v-else-if="isProcurementSpecialistRole"
              class="p-4 rounded-lg bg-warning/10 border border-warning"
            >
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-shopping-cart"
                  class="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="font-semibold text-warning mb-1">Limited Access Role</p>
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <strong>Procurement Specialists</strong>
                    have limited access to the system. They can manage Purchase Orders (POs), view
                    approved PRFs, and view PO-linked deliveries. They cannot access Issues,
                    Transfers, Reconciliations, or Master Data. Location assignment is optional but
                    recommended for delivery viewing.
                  </p>
                </div>
              </div>
            </div>

            <!-- SUPERVISOR: All locations automatically -->
            <div
              v-else-if="formData.role === 'SUPERVISOR'"
              class="p-4 rounded-lg bg-success/10 border border-success"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-globe" class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <p class="font-semibold text-success mb-1">All Locations Access</p>
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <strong>Supervisors</strong>
                    automatically have access to all locations in the system. No manual location
                    assignment is required. The Default Location is only used as a preference for
                    which location to display first on login.
                  </p>
                </div>
              </div>
            </div>

            <!-- ADMIN: Full system access -->
            <div v-else class="p-4 rounded-lg bg-success/10 border border-success">
              <div class="flex items-start gap-3">
                <UIcon
                  name="i-lucide-shield-check"
                  class="w-5 h-5 text-success flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="font-semibold text-success mb-1">Full System Access</p>
                  <p class="text-sm text-[var(--ui-text-muted)]">
                    <strong>Admins</strong>
                    automatically have full access to all locations with complete control (MANAGE
                    level). They can manage users, items, prices, and close periods. No manual
                    location assignment is required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Password Requirements Help -->
        <UCard class="card-elevated mb-6" :ui="{ body: 'p-3 sm:p-4' }">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-primary" />
              <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)]">
                Password Requirements
              </h2>
            </div>
          </template>

          <div class="text-sm text-[var(--ui-text-muted)]">
            <ul class="list-disc list-inside space-y-1">
              <li>At least 8 characters long</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (@$!%*?&)</li>
            </ul>
          </div>
        </UCard>

        <!-- Action Buttons -->
        <div
          class="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 rounded-lg bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]"
        >
          <UButton
            color="error"
            variant="soft"
            size="lg"
            class="cursor-pointer w-full sm:w-auto"
            @click="handleCancel"
            :disabled="submitting"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-user-plus"
            size="lg"
            class="cursor-pointer w-full sm:w-auto"
            :loading="submitting"
          >
            {{ submitting ? "Creating..." : "Create User" }}
          </UButton>
        </div>
      </UForm>
    </div>

    <!-- Cancel Confirmation Modal -->
    <UModal
      v-model:open="isCancelModalOpen"
      title="Discard Changes?"
      description="You have unsaved changes that will be lost."
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-[var(--ui-text)]">
            Are you sure you want to leave? All entered data will be discarded.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            @click="isCancelModalOpen = false"
          >
            Continue Editing
          </UButton>
          <UButton color="error" icon="i-lucide-x" class="cursor-pointer" @click="confirmCancel">
            Discard Changes
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
