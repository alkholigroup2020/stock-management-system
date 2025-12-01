import { defineAppConfig } from "nuxt/app";

export default defineAppConfig({
  // App-level configuration
  // Note: Custom colors are configured via CSS variables in app/assets/css/main.css
  // using --ui-primary and --ui-secondary mappings
  ui: {
    input: {
      variants: {
        variant: {
          outline: "border-[var(--ui-border)]",
        },
      },
    },
    textarea: {
      variants: {
        variant: {
          outline: "border-[var(--ui-border)]",
        },
      },
    },
    select: {
      variants: {
        variant: {
          outline: "border-[var(--ui-border)]",
        },
      },
    },
    selectMenu: {
      variants: {
        variant: {
          outline: "border-[var(--ui-border)]",
        },
      },
    },
    button: {
      variants: {
        variant: {
          outline: "border-[var(--ui-border)]",
        },
      },
    },
  },
});
