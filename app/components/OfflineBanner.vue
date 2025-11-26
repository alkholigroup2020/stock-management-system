<script setup lang="ts">
/**
 * Offline Banner Component
 *
 * Displays a fixed banner at the top of the viewport when the user loses
 * internet connection. Shows a reconnection message when connection is restored.
 */

const { isOnline } = useOnlineStatus();
const wasOffline = ref(false);
const reconnectTimer = ref<ReturnType<typeof setTimeout>>();

watch(isOnline, (online) => {
  if (!online) {
    // User went offline
    wasOffline.value = true;
  } else if (wasOffline.value) {
    // User came back online after being offline - show reconnected message for 3s
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

<template>
  <!-- Offline Banner -->
  <Transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 z-[100] bg-[var(--ui-error)] text-white py-2 px-4 text-center text-sm font-medium shadow-md"
    >
      <span class="inline-flex items-center gap-2">
        <UIcon name="i-heroicons-signal-slash" class="w-4 h-4" />
        You're offline. Some features are unavailable.
      </span>
    </div>
  </Transition>

  <!-- Reconnected Banner -->
  <Transition name="slide-down">
    <div
      v-if="wasOffline && isOnline"
      class="fixed top-0 left-0 right-0 z-[100] bg-[var(--ui-success)] text-white py-2 px-4 text-center text-sm font-medium shadow-md"
    >
      <span class="inline-flex items-center gap-2">
        <UIcon name="i-heroicons-signal" class="w-4 h-4" />
        Connection restored!
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
