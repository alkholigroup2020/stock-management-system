#!/bin/bash
# Convert remaining v-show sections to accordion format

file="app/components/developer/FormsValidationGuide.vue"

# Array of sections to convert with their icons
declare -A sections
sections["zod-validation"]="i-heroicons-shield-check|Zod Schema Validation"
sections["manual-validation"]="i-heroicons-adjustments-horizontal|Manual Validation Pattern"
sections["uform-pattern"]="i-heroicons-rectangle-group|UForm Component Pattern"
sections["form-submission"]="i-heroicons-paper-airplane|Form Submission Patterns"
sections["error-display"]="i-heroicons-exclamation-triangle|Error Display Patterns"
sections["loading-states"]="i-heroicons-arrow-path|Loading States"
sections["cancel-confirmation"]="i-heroicons-x-circle|Cancel Confirmation"
sections["form-state-management"]="i-heroicons-variable|Form State Management"
sections["field-specific-patterns"]="i-heroicons-queue-list|Field-Specific Patterns"
sections["best-practices"]="i-heroicons-check-badge|Best Practices Summary"

for key in "${!sections[@]}"; do
    IFS='|' read -r icon label <<< "${sections[$key]}"
    echo "Converting $key..."
    
    # Convert section opening
    sed -i "s|<section v-show=\"activeSubSection === '$key'\" class=\"space-y-4\">|<section id=\"dev-section-$key\" class=\"overflow-hidden rounded-lg border border-[var(--ui-border)]\">\
      <button class=\"flex w-full cursor-pointer items-center justify-between bg-[var(--ui-bg-elevated)] p-4 transition-colors hover:bg-[var(--ui-bg-accented)]\" @click=\"toggleSection('$key')\">\
        <span class=\"flex items-center gap-3\">\
          <UIcon name=\"$icon\" class=\"text-xl text-[var(--ui-primary)]\" />\
          <span class=\"font-semibold text-[var(--ui-text-highlighted)]\">$label</span>\
        </span>\
        <UIcon :name=\"isExpanded('$key') ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'\" class=\"text-[var(--ui-text-muted)]\" />\
      </button>\
      <div v-if=\"isExpanded('$key')\" class=\"space-y-4 p-4\">|" "$file"
done

echo "Done!"
