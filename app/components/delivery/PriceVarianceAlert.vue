<script setup lang="ts">
/**
 * PriceVarianceAlert Component
 *
 * Displays alert messages for price variance warnings in deliveries.
 * Shows count of items with variance and explains NCR auto-generation.
 */

interface Props {
  varianceCount: number
  totalVarianceAmount?: number
  variant?: 'subtle' | 'solid' | 'outline'
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'subtle',
  showDetails: true,
  totalVarianceAmount: 0,
})

// Format currency for display
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Computed message
const message = computed(() => {
  const count = props.varianceCount
  const plural = count === 1 ? 'item has' : 'items have'
  const baseMessage = `${count} ${plural} price variance.`

  if (props.showDetails && props.totalVarianceAmount !== 0) {
    return `${baseMessage} Total variance: ${formatCurrency(props.totalVarianceAmount)}. NCRs will be automatically generated.`
  }

  return `${baseMessage} NCRs will be automatically generated.`
})
</script>

<template>
  <UAlert
    v-if="varianceCount > 0"
    icon="i-lucide-alert-triangle"
    color="warning"
    :variant="variant"
    title="Price Variance Detected"
    :description="message"
    class="animate-fade-in"
  />
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
