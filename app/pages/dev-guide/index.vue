<script setup lang="ts">
definePageMeta({
  middleware: ["dev-only"],
});

// Redirect to getting-started section
navigateTo("/dev-guide/getting-started", { replace: true });
</script>
