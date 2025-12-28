# Loading Experience Documentation

This document describes the complete loading experience implemented in the Stock Management System, covering all loading states from initial page load to page-to-page navigation.

## Overview

The application uses a **two-tier loading system** to provide a seamless user experience:

| Component                | Purpose                                      | When It Shows                |
| ------------------------ | -------------------------------------------- | ---------------------------- |
| **Loading Screen**       | Full-screen loader during app initialization | Hard refresh, login, logout  |
| **Page Loading Overlay** | Spinner overlay during page navigation       | Route changes within the app |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Loading System                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │   Loading Screen     │    │   Page Loading Overlay        │  │
│  │   (Full-screen)      │    │   (Content area spinner)      │  │
│  ├──────────────────────┤    ├───────────────────────────────┤  │
│  │ • App initialization │    │ • Page-to-page navigation     │  │
│  │ • Login transition   │    │ • Route changes               │  │
│  │ • Logout transition  │    │ • Async page components       │  │
│  │ • Hard refresh       │    │                               │  │
│  └──────────────────────┘    └───────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │ 00.loading-screen    │    │ layouts/default.vue           │  │
│  │ .client.ts           │    │ <LayoutPageLoadingOverlay />  │  │
│  └──────────────────────┘    └───────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │ useAppInit()         │    │ useLoadingIndicator()         │  │
│  │ composable           │    │ (Nuxt built-in)               │  │
│  └──────────────────────┘    └───────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component 1: Loading Screen (Full-Screen)

### Purpose

Displays a branded full-screen loading state during critical app transitions:

- Initial page load / hard refresh
- Login (while fetching user data, locations, and period)
- Logout (while reinitializing app state)

### Implementation

**File:** `app/plugins/00.loading-screen.client.ts`

The loading screen is implemented as a Nuxt plugin with the `00` prefix to ensure it runs early in the plugin lifecycle.

#### Key Features

1. **Static HTML Injection**: Injects loading screen HTML directly into the DOM before Vue mounts, ensuring immediate visibility
2. **CSS-based Styling**: Uses inline styles injected into the document head for reliable rendering
3. **Smooth Transitions**: Fade-out animation when transitioning to content
4. **Reactive State Watching**: Monitors `appInit.isReady` state to show/hide appropriately

#### Visual Design

```
┌─────────────────────────────────────────┐
│                                         │
│              [App Logo]                 │
│                                         │
│          Stock Management               │
│    Multi-Location Inventory System      │
│                                         │
│           [Spinner] Loading...          │
│                                         │
└─────────────────────────────────────────┘
```

- **Theme Detection**: Automatically detects user's theme preference from localStorage or system settings
- **Logo**: SVG app icon with glow effect
- **Spinner**: Animated rotating circle in emerald color
- **Text**: App name and subtitle

**Light Mode Colors:**

- Background: Light blue-gray gradient (`#f0f4f8` → `#ffffff` → `#f0f4f8`)
- Title text: Dark zinc (`#18181b`)
- Subtitle text: Muted zinc (`#52525b`)

**Dark Mode Colors:**

- Background: Deep navy gradient (`#0c1220` → `#151c2c` → `#0c1220`)
- Title text: Light blue-white (`#eef1f5`)
- Subtitle text: Muted slate (`#a0aec0`)

#### How It Works

```typescript
// Plugin lifecycle
1. Module loads → showLoadingScreen() called immediately
2. Vue app mounts → Plugin hooks into app:mounted
3. Watcher created on appInit.isReady
4. When isReady = true → hideLoadingScreen() with fade animation
5. When isReady = false (after being true) → showLoadingScreen() again
```

### State Management

**File:** `app/composables/useAppInit.ts`

The `useAppInit` composable coordinates app initialization and provides loading state:

```typescript
interface AppInitState {
  isInitializing: boolean; // Currently loading
  isReady: boolean; // App ready to render
  error: string | null; // Any initialization error
  authLoaded: boolean; // Auth session fetched
  locationsLoaded: boolean; // User locations loaded
  periodLoaded: boolean; // Current period loaded
}
```

#### Key Methods

| Method                     | Purpose                                            |
| -------------------------- | -------------------------------------------------- |
| `initialize()`             | Initial app load - fetches auth, locations, period |
| `setLoadingForPostLogin()` | Called after login to show loading screen          |
| `setReadyAfterPostLogin()` | Called when post-login data is loaded              |
| `reinitialize()`           | Called on logout to reset and re-init              |
| `reset()`                  | Clears all state                                   |

### Integration Points

#### Login Flow (`app/stores/auth.ts`)

```typescript
async login(email, password) {
  // ... authenticate user ...

  // Show loading screen
  appInit.setLoadingForPostLogin();

  try {
    // Fetch required data
    await Promise.all([
      locationStore.fetchUserLocations(true),
      periodStore.fetchCurrentPeriod(true),
    ]);
  } finally {
    // Always hide loading screen
    appInit.setReadyAfterPostLogin();
  }
}
```

#### Logout Flow (`app/stores/auth.ts`)

```typescript
async logout() {
  // ... clear session ...

  // Reset stores and reinitialize
  locationStore.reset();
  periodStore.reset();
  await appInit.reinitialize();
}
```

## Component 2: Page Loading Overlay (Spinner)

### Purpose

Displays the app logo with a centered spinner during route navigation, providing branded visual feedback that the next page is loading. The overlay only covers the main content area with a solid background, keeping the sidebar, header, and footer visible and interactive.

### Implementation

**File:** `app/components/layout/PageLoadingOverlay.vue`

```vue
<script setup lang="ts">
const { isLoading } = useLoadingIndicator();
</script>

<template>
  <Transition name="fade">
    <div v-if="isLoading" class="absolute inset-0 z-40 flex items-center justify-center bg-default">
      <div class="flex flex-col items-center gap-4">
        <!-- App Logo -->
        <img
          src="~/assets/css/icons/app-icon.svg"
          alt="Stock Management System"
          class="w-16 h-16 rounded-xl"
        />
        <!-- Spinner with text -->
        <div class="flex items-center gap-3">
          <div
            class="w-5 h-5 border-3 border-primary/30 border-t-primary rounded-full animate-spin"
          />
          <span class="text-sm text-muted font-medium">Loading...</span>
        </div>
      </div>
    </div>
  </Transition>
</template>
```

**File:** `app/layouts/default.vue` (placement)

```vue
<template #body>
  <div class="relative h-full">
    <!-- Page navigation loading overlay -->
    <LayoutPageLoadingOverlay />

    <main id="main-content" ...>
      <slot />
    </main>
  </div>
</template>
```

### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar  │  Header (visible during loading)                │
│           ├─────────────────────────────────────────────────┤
│  (visible │  ┌─────────────────────────────────────────┐   │
│   during  │  │                                         │   │
│  loading) │  │           [App Logo]                    │   │
│           │  │         [⟳] Loading...                  │   │
│           │  │                                         │   │
│           │  │        (solid background)               │   │
│           │  └─────────────────────────────────────────┘   │
│           ├─────────────────────────────────────────────────┤
│           │  Footer (visible during loading)                │
└───────────┴─────────────────────────────────────────────────┘
```

### Key Features

| Feature                    | Description                                         |
| -------------------------- | --------------------------------------------------- |
| **Scoped to content area** | Only covers main content, not sidebar/header/footer |
| **Solid background**       | `bg-default` for clean, branded appearance          |
| **App logo**               | 64x64px logo with rounded corners                   |
| **Centered spinner**       | Small animated spinner with "Loading..." text       |
| **Fade transition**        | Smooth 150ms fade in/out animation                  |
| **Accessible**             | Includes `role="status"` and `aria-label`           |

### When It Shows

- Navigating from Dashboard to Deliveries
- Clicking sidebar navigation links
- Using `navigateTo()` programmatically
- Any route change within the app

## File Structure

```
app/
├── app.vue                          # Root component with initialization gate
├── plugins/
│   └── 00.loading-screen.client.ts  # Full-screen loading screen plugin
├── layouts/
│   └── default.vue                  # Layout with PageLoadingOverlay
├── components/
│   └── layout/
│       └── PageLoadingOverlay.vue   # Content area spinner overlay
├── composables/
│   └── useAppInit.ts                # App initialization state
└── stores/
    └── auth.ts                      # Login/logout integration
```

## Loading Scenarios

### Scenario 1: Initial Page Load / Hard Refresh

```
User Action: Opens app or presses Ctrl+R / F5

1. Browser loads HTML
2. Plugin injects loading screen (visible immediately)
3. Vue app mounts
4. Plugin hooks into app:mounted
5. useAppInit.initialize() is called
6. Auth session fetched
7. If authenticated:
   - Locations fetched
   - Period fetched
8. appInit.isReady = true
9. Loading screen fades out
10. App content renders
```

### Scenario 2: Login

```
User Action: Submits login form

1. Login API called
2. User authenticated, session created
3. setLoadingForPostLogin() → isReady = false
4. Loading screen appears
5. Locations and period fetched in parallel
6. setReadyAfterPostLogin() → isReady = true
7. Loading screen fades out
8. Dashboard renders
9. Success toast shown
```

### Scenario 3: Logout

```
User Action: Clicks logout

1. Logout API called
2. Session destroyed
3. Stores reset (location, period)
4. appInit.reinitialize() called
5. Loading screen appears briefly
6. Auth check returns unauthenticated
7. isReady = true
8. Loading screen fades out
9. Login page renders
```

### Scenario 4: Page Navigation

```
User Action: Clicks "Deliveries" in sidebar

1. NuxtLoadingIndicator appears at top
2. Route change begins
3. New page component loads
4. Progress bar completes
5. NuxtLoadingIndicator disappears
6. New page renders
```

## Styling Reference

### Loading Screen Colors

The loading screen supports both light and dark themes, automatically detecting the user's preference.

**Light Mode:**

| Element        | Color              | CSS                                                  |
| -------------- | ------------------ | ---------------------------------------------------- |
| Background     | Blue-gray gradient | `linear-gradient(135deg, #f0f4f8, #ffffff, #f0f4f8)` |
| Glow effect    | Emerald            | `rgba(69, 207, 123, 0.2)`                            |
| Spinner border | Emerald            | `#45cf7b`                                            |
| Spinner track  | Emerald (30%)      | `rgba(69, 207, 123, 0.3)`                            |
| Title text     | Dark zinc          | `#18181b`                                            |
| Subtitle text  | Muted zinc         | `#52525b`                                            |

**Dark Mode:**

| Element        | Color            | CSS                                                  |
| -------------- | ---------------- | ---------------------------------------------------- |
| Background     | Navy gradient    | `linear-gradient(135deg, #0c1220, #151c2c, #0c1220)` |
| Glow effect    | Emerald          | `rgba(69, 207, 123, 0.3)`                            |
| Spinner border | Emerald          | `#45cf7b`                                            |
| Spinner track  | Emerald (30%)    | `rgba(69, 207, 123, 0.3)`                            |
| Title text     | Light blue-white | `#eef1f5`                                            |
| Subtitle text  | Muted slate      | `#a0aec0`                                            |

### Progress Bar Colors

| Element   | Color   | Hex       |
| --------- | ------- | --------- |
| Bar color | Emerald | `#10b981` |

## Troubleshooting

### Loading Screen Stuck

**Symptom:** Loading screen doesn't disappear

**Possible Causes:**

1. Error in location or period API
2. `setReadyAfterPostLogin()` not called

**Solution:** Check browser console for errors. The auth store wraps data fetching in try/finally to ensure `setReadyAfterPostLogin()` is always called.

### Loading Screen Not Showing on Login

**Symptom:** Direct jump from login to dashboard without loading screen

**Possible Causes:**

1. `setLoadingForPostLogin()` not called
2. Plugin watcher not detecting state change

**Solution:** Verify auth store calls `setLoadingForPostLogin()` before fetching data.

### Spinner Overlay Not Showing

**Symptom:** No spinner overlay during navigation

**Possible Causes:**

1. `LayoutPageLoadingOverlay` not in layout
2. Navigation too fast (cached pages)
3. Parent container missing `position: relative`

**Solution:** The spinner uses `useLoadingIndicator` which has a throttle, so very fast navigations (under 200ms) may not show it. Ensure the body container has `class="relative h-full"`.

## Performance Considerations

1. **Static HTML Injection**: Loading screen HTML is injected synchronously before Vue hydration, ensuring zero flash of unstyled content
2. **CSS Animations**: All animations use CSS transforms and opacity for GPU acceleration
3. **Minimal Dependencies**: Loading screen has no external dependencies
4. **Parallel Data Fetching**: Location and period data fetched simultaneously after login

## Future Enhancements

- [ ] Add skeleton loaders for individual page sections
- [ ] Implement offline detection in loading screen
- [ ] Add retry button for failed initialization
- [ ] Consider page-specific loading states for slow API calls
