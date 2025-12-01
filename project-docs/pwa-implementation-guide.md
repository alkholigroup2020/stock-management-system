# PWA Implementation Guide - Stock Management System

**Document Version:** 1.0  
**Date:** November 2, 2025  
**Estimated Time:** 2-3 hours

---

## Overview

This guide provides step-by-step instructions for implementing Progressive Web App (PWA) functionality in the Stock Management System using Nuxt 3 and Vite PWA.

---

## Prerequisites

- Nuxt 3 project already initialized
- Node.js 18+ installed
- pnpm package manager
- Basic understanding of service workers

---

## Step 1: Install PWA Module

```bash
# Install the Vite PWA module for Nuxt
pnpm add -D @vite-pwa/nuxt

# This will add the package to devDependencies
```

**Expected Output:**

```
âœ“ @vite-pwa/nuxt added to devDependencies
```

---

## Step 2: Configure Nuxt Config

Update your `nuxt.config.ts` file:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false, // SPA mode

  modules: [
    "@nuxt/ui",
    "@pinia/nuxt",
    "@nuxtjs/tailwindcss",
    "@vite-pwa/nuxt", // Add PWA module
  ],

  // PWA Configuration
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Stock Management System",
      short_name: "FoodStock",
      description: "Stock control and inventory management",
      theme_color: "#000046", // Navy blue - primary brand color
      background_color: "#000046", // Navy blue - matches brand
      display: "standalone",
      orientation: "portrait",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: "/",
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      type: "module",
    },
  },

  // ... rest of your config
});
```

---

## Step 3: Create App Icons

### Required Icon Sizes:

- **192x192 pixels** - Standard icon
- **512x512 pixels** - High-resolution icon
- **favicon.ico** - Browser favicon (32x32)

### Icon Design Guidelines:

1. **Simple and recognizable** - Clear at small sizes
2. **No text** - Icons should be visual only (or minimal text like "FS")
3. **Solid background** - Avoid transparency for maskable icons
4. **Centered design** - Leave 10% padding from edges
5. **Brand colors** - Use the app's color scheme:
   - **Primary background:** Navy Blue (#000046)
   - **Accent/Icon:** Emerald Green (#45cf7b) or White
   - **Text (if any):** White for contrast

### Recommended Tools:

- **Figma** - Design icons
- **Canva** - Quick icon creation
- **RealFaviconGenerator** (https://realfavicongenerator.net/) - Generate all sizes

### File Locations:

```
public/
â”œâ”€â”€ icon-192.png    # 192x192 PNG
â”œâ”€â”€ icon-512.png    # 512x512 PNG
â””â”€â”€ favicon.ico     # 32x32 ICO
```

### Quick Icon Creation (Placeholder):

For development/testing, you can create simple placeholder icons using the brand colors:

```bash
# Using ImageMagick (install first if needed)
# Create a simple icon with navy background and white text

# 192x192 icon with navy blue background
convert -size 192x192 xc:#000046 -font Arial -pointsize 48 \
  -fill white -gravity center -annotate +0+0 "FS" \
  public/icon-192.png

# 512x512 icon with navy blue background
convert -size 512x512 xc:#000046 -font Arial -pointsize 128 \
  -fill white -gravity center -annotate +0+0 "FS" \
  public/icon-512.png

# Alternative: Navy background with emerald accent
# (Add a circular emerald green element for visual interest)
```

**Recommended:** Use an online tool like **Canva** or **Figma** to design proper icons that incorporate:

- Navy blue background (#000046)
- Emerald green accent elements (#45cf7b)
- Simple food/inventory icon symbol
- Clean, modern aesthetic

---

## Step 4: Create Offline Detection Composable

Create a composable to detect online/offline status:

```typescript
// composables/useOnlineStatus.ts

export const useOnlineStatus = () => {
  const isOnline = ref(true);

  // Initialize with current status
  if (process.client) {
    isOnline.value = navigator.onLine;
  }

  const handleOnline = () => {
    isOnline.value = true;
    console.log("ðŸŸ¢ Connection restored");
  };

  const handleOffline = () => {
    isOnline.value = false;
    console.log("ðŸ”´ Connection lost");
  };

  onMounted(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  });

  return {
    isOnline: readonly(isOnline),
  };
};
```

---

## Step 5: Add Offline Banner Component

Create a component to show offline status:

```vue
<!-- components/OfflineBanner.vue -->
<template>
  <div
    v-if="!isOnline"
    class="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-2 px-4 text-center text-sm font-medium"
  >
    <span class="inline-flex items-center gap-2">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
        />
      </svg>
      You're offline. Some features are unavailable.
    </span>
  </div>

  <Transition name="slide-down">
    <div
      v-if="wasOffline && isOnline"
      class="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white py-2 px-4 text-center text-sm font-medium"
    >
      <span class="inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Connection restored!
      </span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isOnline } = useOnlineStatus();
const wasOffline = ref(false);
const reconnectTimer = ref<NodeJS.Timeout>();

watch(isOnline, (online) => {
  if (!online) {
    wasOffline.value = true;
  } else if (wasOffline.value) {
    // Show "reconnected" message for 3 seconds
    reconnectTimer.value = setTimeout(() => {
      wasOffline.value = false;
    }, 3000);
  }
});

onUnmounted(() => {
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value);
  }
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
```

---

## Step 6: Add Banner to App Layout

Add the offline banner to your main layout:

```vue
<!-- app.vue or layouts/default.vue -->
<template>
  <div>
    <OfflineBanner />

    <!-- Your existing layout -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
```

---

## Step 7: Disable Forms When Offline

Create a wrapper for action buttons:

```typescript
// composables/useOfflineGuard.ts

export const useOfflineGuard = () => {
  const { isOnline } = useOnlineStatus();
  const toast = useToast();

  const guardAction = async (action: () => Promise<void>, actionName: string) => {
    if (!isOnline.value) {
      toast.add({
        title: "No Connection",
        description: `Cannot ${actionName} while offline. Please check your connection.`,
        color: "red",
        icon: "i-heroicons-wifi-slash",
      });
      return;
    }

    await action();
  };

  return {
    isOnline,
    guardAction,
  };
};
```

Usage in components:

```vue
<script setup lang="ts">
const { isOnline, guardAction } = useOfflineGuard();

async function handleSubmit() {
  await guardAction(async () => {
    // Your actual submit logic
    await $fetch("/api/deliveries/post", {
      method: "POST",
      body: deliveryData,
    });
  }, "post delivery");
}
</script>

<template>
  <UButton :disabled="!isOnline" @click="handleSubmit">
    Post Delivery
    <template #trailing v-if="!isOnline">
      <UIcon name="i-heroicons-wifi-slash" />
    </template>
  </UButton>
</template>
```

---

## Step 8: Test PWA Functionality

### Testing in Development:

1. **Start dev server:**

   ```bash
   pnpm dev
   ```

2. **Open in browser:**
   - Chrome: `http://localhost:3000`
   - Enable dev tools PWA debugging

3. **Check PWA status:**
   - Chrome DevTools â†’ Application â†’ Manifest
   - Should show your app name, icons, etc.

4. **Test offline mode:**
   - Chrome DevTools â†’ Network â†’ Enable "Offline"
   - Navigate the app
   - Should show offline banner
   - Disable offline â†’ should show reconnect message

5. **Test service worker:**
   - Chrome DevTools â†’ Application â†’ Service Workers
   - Should show registered service worker
   - Can simulate update events

### Testing Installation:

**Desktop (Chrome):**

1. Visit your app URL
2. Look for install icon in address bar (âŠ• or ðŸ”½)
3. Click to install
4. App opens in standalone window

**Mobile (Android):**

1. Open in Chrome
2. Menu â†’ "Install app" or "Add to Home Screen"
3. App icon appears on home screen
4. Opens full-screen without browser UI

**Mobile (iOS):**

1. Open in Safari
2. Share button â†’ "Add to Home Screen"
3. Icon appears on home screen
4. Opens full-screen

---

## Step 9: Production Deployment

### Build and Deploy:

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Verify on Vercel:

1. **Push to GitHub** (triggers auto-deploy)
2. **Visit deployed URL**
3. **Check PWA features:**
   - Manifest loads
   - Service worker registers
   - Install prompt appears
4. **Test on mobile device**

### Vercel Configuration:

Vercel automatically handles PWA requirements:

- âœ… HTTPS (required for PWA)
- âœ… Service worker caching
- âœ… Manifest serving
- âœ… Asset compression

No additional Vercel config needed!

---

## Step 10: Monitor and Maintain

### Analytics to Track:

```typescript
// Track PWA installation
if (process.client) {
  window.addEventListener("appinstalled", () => {
    console.log("âœ… PWA installed");
    // Optional: Send to analytics
    // gtag('event', 'pwa_install')
  });
}

// Track service worker updates
if (process.client && "serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("ðŸ”„ Service Worker updated");
    // Optional: Show update notification
  });
}
```

### Regular Maintenance:

1. **Update icons** if branding changes
2. **Test offline behavior** after major updates
3. **Monitor service worker** for errors
4. **Check install rates** (via analytics)

---

## Troubleshooting

### Issue: Service Worker Not Registering

**Solution:**

- Check HTTPS is enabled (required for SW)
- Clear browser cache
- Check console for errors
- Verify `pwa` config in nuxt.config.ts

### Issue: Icons Not Showing

**Solution:**

- Verify icon files exist in `/public/`
- Check file names match manifest
- Clear browser cache
- Use correct PNG format (not JPG)

### Issue: App Not Installable

**Solution:**

- Manifest must be valid JSON
- Need at least 192px and 512px icons
- HTTPS required
- Service worker must register successfully

### Issue: Offline Mode Not Working

**Solution:**

- Check service worker is active
- Verify caching strategy in workbox config
- Test with `navigator.onLine` API
- Check network tab in DevTools

---

## Testing Checklist

Before marking PWA implementation complete:

- [ ] PWA module installed and configured
- [ ] Icons created (192px, 512px, favicon)
- [ ] Offline banner shows when disconnected
- [ ] Forms disabled when offline
- [ ] Reconnect message appears
- [ ] App installable on desktop
- [ ] App installable on mobile (Android)
- [ ] App installable on mobile (iOS)
- [ ] Service worker registers correctly
- [ ] Cached assets load offline
- [ ] Manifest appears in DevTools
- [ ] HTTPS enabled on production
- [ ] Production deployment tested

---

## Next Steps (Post-MVP)

### Level 2 PWA Features:

- [ ] Background sync for failed requests
- [ ] Push notifications for period reminders
- [ ] Offline queue for deliveries/issues
- [ ] IndexedDB for local data caching

### Level 3 PWA Features:

- [ ] Full offline mode
- [ ] Sync engine (bidirectional)
- [ ] Conflict resolution
- [ ] Local-first architecture

---

## Resources

- **Vite PWA Plugin:** https://vite-pwa-org.netlify.app/
- **Workbox Docs:** https://developers.google.com/web/tools/workbox
- **PWA Builder:** https://www.pwabuilder.com/
- **Web.dev PWA Guide:** https://web.dev/progressive-web-apps/
- **MDN Service Worker:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## Summary

This guide covered:
âœ… Installing and configuring Vite PWA for Nuxt  
âœ… Creating app icons  
âœ… Detecting online/offline status  
âœ… Building offline-aware UI  
âœ… Testing PWA functionality  
âœ… Deploying to production

**Estimated time:** 2-3 hours for basic implementation

**Result:** Fully functional Level 1 PWA with installability and offline awareness.

---

**Document Version:** 1.0  
**Last Updated:** November 2, 2025
