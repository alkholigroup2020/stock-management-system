# Interaction Patterns

Audit runtime behaviors: async feedback, confirmations, and state transitions.

## Async Operation Checklist

For every function that calls an API or performs async work, verify:

### 1. Immediate Feedback (Loading State)
```vue
<!-- ❌ BAD: No loading indication -->
<UButton @click="deactivateUser">Deactivate</UButton>

<!-- ✅ GOOD: Loading state bound -->
<UButton :loading="isDeactivating" @click="deactivateUser">
  Deactivate
</UButton>
```

**Code patterns to flag:**
- `@click` handler with `await` but no `:loading` prop
- `async` function called without setting loading state first
- `useFetch` or `$fetch` without pending state handling

### 2. Success Feedback
User must know the action completed.

```ts
// ❌ BAD: Silent success
async function deactivateUser() {
  await $fetch(`/api/users/${id}/deactivate`, { method: 'POST' })
  // ... nothing happens visually
}

// ✅ GOOD: Clear success feedback
async function deactivateUser() {
  await $fetch(`/api/users/${id}/deactivate`, { method: 'POST' })
  toast.add({ title: 'User deactivated', color: 'green' })
  // OR: update UI state, redirect, refresh list
}
```

**Acceptable success patterns:**
- Toast notification
- Inline status change (e.g., badge changes from "Active" to "Inactive")
- Redirect to different page
- Modal closes + list refreshes
- Optimistic UI update

### 3. Error Feedback
Failures must be communicated with recovery options.

```ts
// ❌ BAD: Silent failure or generic error
try {
  await $fetch(...)
} catch (e) {
  console.error(e) // User sees nothing
}

// ✅ GOOD: User-facing error with guidance
try {
  await $fetch(...)
} catch (e) {
  toast.add({
    title: 'Could not deactivate user',
    description: 'Please try again or contact support.',
    color: 'red'
  })
}
```

### 4. Button State During Operation
Prevent double-clicks and show progress.

```vue
<UButton
  :loading="isDeactivating"
  :disabled="isDeactivating"
  @click="deactivateUser"
>
  Deactivate
</UButton>
```

**Check that buttons are:**
- Disabled during operation (or loading state handles this)
- Not clickable while pending
- Restored after completion (success or error)

## Confirmation Requirements

### Actions Requiring Confirmation

| Action Type | Confirmation Required | Example |
|-------------|----------------------|---------|
| Delete | **Always** | Delete user, remove file |
| Deactivate/Disable | **Always** | Deactivate account, disable feature |
| Bulk operations | **Always** | Delete selected, bulk update |
| Irreversible changes | **Always** | Reset password, clear data |
| Financial actions | **Always** | Process payment, issue refund |
| Permission changes | Recommended | Remove admin, change role |
| Send/Publish | Recommended | Send email, publish post |

### Confirmation Dialog Pattern

```vue
<!-- Trigger -->
<UButton color="red" @click="isConfirmOpen = true">
  Delete
</UButton>

<!-- Confirmation Modal -->
<UModal v-model="isConfirmOpen">
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Delete User</h3>
    </template>

    <p>Are you sure you want to delete <strong>{{ user.name }}</strong>?</p>
    <p class="text-sm text-gray-500 mt-2">This action cannot be undone.</p>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <UButton variant="ghost" @click="isConfirmOpen = false">
          Cancel
        </UButton>
        <UButton color="red" :loading="isDeleting" @click="confirmDelete">
          Delete
        </UButton>
      </div>
    </template>
  </UCard>
</UModal>
```

### Confirmation Dialog Checklist

- [ ] Clear action description in title
- [ ] States what will happen and to what item
- [ ] Warns if irreversible
- [ ] Cancel button is easy to reach (left or prominent)
- [ ] Destructive action button matches action (red for delete)
- [ ] Destructive button has loading state
- [ ] Modal closable via X, Escape, or click outside

### Code Patterns to Flag

**Missing confirmation:**
```ts
// ❌ Direct delete without confirmation
async function deleteUser(id: string) {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
}

// In template:
<UButton color="red" @click="deleteUser(user.id)">Delete</UButton>
```

**Proper confirmation:**
```ts
// ✅ Delete with confirmation flow
const userToDelete = ref<User | null>(null)
const isConfirmOpen = computed(() => !!userToDelete.value)

function promptDelete(user: User) {
  userToDelete.value = user
}

async function confirmDelete() {
  if (!userToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'User deleted', color: 'green' })
    userToDelete.value = null
    await refresh()
  } catch (e) {
    toast.add({ title: 'Failed to delete user', color: 'red' })
  } finally {
    isDeleting.value = false
  }
}
```

## Audit Process for Claude Code

When reviewing a component with actions, systematically check:

### Step 1: Find All Action Handlers
```bash
# Search patterns in the component
grep -E "@click|@submit|@change" <component>.vue
```

### Step 2: For Each Async Handler, Verify
1. **Loading state**: Is there a `ref` that tracks pending state?
2. **Binding**: Is `:loading` or `:disabled` bound to that ref?
3. **Success path**: What happens on success? Is it visible to user?
4. **Error path**: Is there a `catch` block with user feedback?

### Step 3: For Destructive Actions, Verify
1. **Confirmation**: Is there a modal/dialog before the action?
2. **Clear language**: Does it say what will be deleted/changed?
3. **Escape route**: Can user easily cancel?

### Step 4: Report Findings
Format issues as:

```
## [Severity] Missing loading state on deactivate action

**Location**: `components/UserCard.vue:45`
**Issue**: `deactivateUser()` is async but button has no loading indication
**User impact**: User may click multiple times, no feedback during 2-3s API call
**Fix**:
\`\`\`vue
<UButton :loading="isDeactivating" @click="deactivateUser">
\`\`\`
```

## Common Nuxt/Vue Patterns to Check

### useFetch / useAsyncData
```vue
<script setup>
const { data, pending, error, refresh } = await useFetch('/api/users')
</script>

<template>
  <!-- ✅ Check: Is `pending` used for loading states? -->
  <!-- ✅ Check: Is `error` displayed to user? -->
</template>
```

### Form Submissions
```vue
<UForm @submit="onSubmit">
  <!-- ✅ Check: Does submit button have :loading? -->
  <!-- ✅ Check: Is there success/error handling? -->
  <UButton type="submit" :loading="isSubmitting">Save</UButton>
</UForm>
```

### Optimistic Updates
If using optimistic UI, verify rollback on error:
```ts
// ✅ Proper optimistic update
users.value = users.value.filter(u => u.id !== id) // Optimistic
try {
  await $fetch(`/api/users/${id}`, { method: 'DELETE' })
} catch (e) {
  await refresh() // Rollback by refetching
  toast.add({ title: 'Delete failed', color: 'red' })
}
```
