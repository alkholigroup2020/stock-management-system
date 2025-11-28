<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import { z } from "zod";
import type { UserRole } from "@prisma/client";

definePageMeta({
  middleware: "role",
  roleRequired: "ADMIN",
});

const toast = useToast();
const router = useRouter();

// Form state
const loading = ref(false);
const locations = ref<Array<{ id: string; code: string; name: string; type: string }>>([]);

// Form schema
const schema = z.object({
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
  role: z.enum(["OPERATOR", "SUPERVISOR", "ADMIN"]),
  default_location_id: z.string().uuid("Invalid location").optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type Schema = z.output<typeof schema>;

// Form data
const state = reactive({
  username: "",
  email: "",
  password: "",
  confirm_password: "",
  full_name: "",
  role: "OPERATOR" as UserRole,
  default_location_id: undefined as string | undefined,
});

// Role options
const roleOptions = [
  { value: "OPERATOR", label: "Operator", description: "Can post transactions and view stock" },
  {
    value: "SUPERVISOR",
    label: "Supervisor",
    description: "Can approve transfers and edit reconciliations",
  },
  { value: "ADMIN", label: "Admin", description: "Full system access and management" },
];

// Fetch locations
const fetchLocations = async () => {
  try {
    const response = await $fetch<{ locations: typeof locations.value }>("/api/locations");
    locations.value = response.locations;
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to load locations",
      color: "error",
    });
  }
};

// Submit handler
const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    loading.value = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirm_password, ...userData } = event.data;

    await $fetch("/api/auth/register", {
      method: "POST",
      body: userData,
    });

    toast.add({
      title: "Success",
      description: "User created successfully",
      color: "success",
    });

    router.push("/users");
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.data?.message || "Failed to create user",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Load locations on mount
onMounted(() => {
  fetchLocations();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <UButton
        icon="i-heroicons-arrow-left"
        color="neutral"
        variant="ghost"
        to="/users"
        aria-label="Back to users"
        class="cursor-pointer"
      />
      <div>
        <h1 class="text-heading">Create New User</h1>
        <p class="text-caption mt-1">Add a new user to the system</p>
      </div>
    </div>

    <!-- Form -->
    <UCard>
      <UForm :schema="schema" :state="state" @submit="onSubmit">
        <div class="space-y-6">
          <!-- Account Information -->
          <div>
            <h3 class="text-label mb-4">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField name="username" label="Username" required>
                <UInput
                  v-model="state.username"
                  placeholder="e.g., john.doe"
                  icon="i-heroicons-at-symbol"
                />
              </UFormField>

              <UFormField name="email" label="Email Address" required>
                <UInput
                  v-model="state.email"
                  type="email"
                  placeholder="e.g., john@example.com"
                  icon="i-heroicons-envelope"
                />
              </UFormField>

              <UFormField name="password" label="Password" required>
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-heroicons-lock-closed"
                />
              </UFormField>

              <UFormField name="confirm_password" label="Confirm Password" required>
                <UInput
                  v-model="state.confirm_password"
                  type="password"
                  placeholder="••••••••"
                  icon="i-heroicons-lock-closed"
                />
              </UFormField>
            </div>
          </div>

          <!-- Personal Information -->
          <div>
            <h3 class="text-label mb-4">Personal Information</h3>
            <UFormField name="full_name" label="Full Name" required>
              <UInput
                v-model="state.full_name"
                placeholder="e.g., John Doe"
                icon="i-heroicons-user"
              />
            </UFormField>
          </div>

          <!-- Role & Permissions -->
          <div>
            <h3 class="text-label mb-4">Role & Permissions</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField name="role" label="User Role" required>
                <USelect v-model="state.role" :items="roleOptions" />
              </UFormField>

              <UFormField
                name="default_location_id"
                label="Default Location"
                description="Optional - User's default working location"
              >
                <USelect
                  v-model="state.default_location_id"
                  :items="[
                    { value: undefined, label: 'None' },
                    ...locations.map((l) => ({
                      value: l.id,
                      label: `${l.code} - ${l.name}`,
                    })),
                  ]"
                  placeholder="Select location (optional)"
                />
              </UFormField>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t border-default">
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              to="/users"
              class="cursor-pointer"
            />
            <UButton
              type="submit"
              label="Create User"
              color="primary"
              :loading="loading"
              :disabled="loading"
              class="cursor-pointer"
            />
          </div>
        </div>
      </UForm>
    </UCard>

    <!-- Password Requirements Help -->
    <UCard class="mt-4">
      <div class="text-caption">
        <h4 class="font-medium text-default mb-2">Password Requirements:</h4>
        <ul class="list-disc list-inside space-y-1">
          <li>At least 8 characters long</li>
          <li>At least one uppercase letter (A-Z)</li>
          <li>At least one lowercase letter (a-z)</li>
          <li>At least one number (0-9)</li>
          <li>At least one special character (@$!%*?&)</li>
        </ul>
      </div>
    </UCard>
  </div>
</template>
