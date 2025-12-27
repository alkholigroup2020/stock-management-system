/**
 * Loading Screen Plugin
 *
 * This plugin runs early (00 prefix) and manages a loading screen that appears:
 * 1. During initial page load/refresh
 * 2. During login transition (while fetching user data)
 * 3. During logout transition
 *
 * The loading screen is removed when the app initialization completes.
 */

const LOADING_SCREEN_ID = "app-loading-screen";

// App logo SVG as a data URI for reliable loading
const APP_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="80" height="80">
  <defs>
    <clipPath id="rounded-corners">
      <rect width="512" height="512" rx="102"/>
    </clipPath>
  </defs>
  <g clip-path="url(#rounded-corners)">
    <rect x="90" y="300" width="95" height="95" rx="14" fill="#45cf7b"/>
    <g transform="translate(137.5, 347.5)">
      <rect x="-22" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="-22" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
    </g>
    <rect x="208" y="300" width="95" height="95" rx="14" fill="#45cf7b"/>
    <g transform="translate(255.5, 347.5)">
      <rect x="-22" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="-22" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
    </g>
    <rect x="326" y="300" width="95" height="95" rx="14" fill="#45cf7b"/>
    <g transform="translate(373.5, 347.5)">
      <rect x="-22" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="-22" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="-22" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
      <rect x="4" y="4" width="18" height="18" rx="4" fill="#ffffff"/>
    </g>
    <rect x="149" y="190" width="95" height="95" rx="14" fill="#45cf7b"/>
    <path d="M172 237 L190 255 L225 218" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <rect x="267" y="190" width="95" height="95" rx="14" fill="#45cf7b"/>
    <g transform="translate(283, 215)">
      <rect x="0" y="35" width="16" height="25" rx="3" fill="#ffffff"/>
      <rect x="24" y="20" width="16" height="40" rx="3" fill="#ffffff"/>
      <rect x="48" y="5" width="16" height="55" rx="3" fill="#ffffff"/>
    </g>
    <rect x="208" y="80" width="95" height="95" rx="14" fill="#45cf7b"/>
    <g transform="translate(255.5, 127.5)">
      <path d="M0 -25 L18 0 L9 0 L9 25 L-9 25 L-9 0 L-18 0 Z" fill="#ffffff"/>
    </g>
  </g>
</svg>`;

// Inject loading screen styles once
function injectStyles() {
  const styleId = `${LOADING_SCREEN_ID}-styles`;
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes app-loading-spin {
      to { transform: rotate(360deg); }
    }
    #${LOADING_SCREEN_ID} {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    #${LOADING_SCREEN_ID}.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    #${LOADING_SCREEN_ID} .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      position: relative;
    }
    #${LOADING_SCREEN_ID} .glow {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 120px;
      height: 120px;
      background: rgba(16, 185, 129, 0.3);
      border-radius: 50%;
      filter: blur(30px);
    }
    #${LOADING_SCREEN_ID} .icon {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #${LOADING_SCREEN_ID} .icon svg {
      width: 80px;
      height: 80px;
      filter: drop-shadow(0 10px 40px rgba(16, 185, 129, 0.3));
    }
    #${LOADING_SCREEN_ID} .text {
      text-align: center;
    }
    #${LOADING_SCREEN_ID} .text h1 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 4px 0;
    }
    #${LOADING_SCREEN_ID} .text p {
      font-size: 0.875rem;
      color: #a1a1aa;
      margin: 0;
    }
    #${LOADING_SCREEN_ID} .spinner-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    #${LOADING_SCREEN_ID} .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(16, 185, 129, 0.3);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: app-loading-spin 1s linear infinite;
    }
    #${LOADING_SCREEN_ID} .spinner-text {
      font-size: 0.875rem;
      color: #a1a1aa;
    }
  `;
  document.head.appendChild(style);
}

// Track the removal timeout so we can cancel it if needed
let removalTimeout: ReturnType<typeof setTimeout> | null = null;

// Create the loading screen HTML content
function createLoadingScreenHTML(): string {
  return `
    <div class="content">
      <div class="glow"></div>
      <div class="icon">
        ${APP_LOGO_SVG}
      </div>
      <div class="text">
        <h1>Stock Management</h1>
        <p>Multi-Location Inventory System</p>
      </div>
      <div class="spinner-container">
        <div class="spinner"></div>
        <span class="spinner-text">Loading...</span>
      </div>
    </div>
  `;
}

// Show the loading screen (inject if not exists, or remove fade-out class)
function showLoadingScreen() {
  injectStyles();

  // Cancel any pending removal
  if (removalTimeout) {
    clearTimeout(removalTimeout);
    removalTimeout = null;
  }

  let loadingScreen = document.getElementById(LOADING_SCREEN_ID);

  if (loadingScreen) {
    // Already exists - make sure it's visible and has content
    loadingScreen.classList.remove("fade-out");
    // Re-inject content in case it was cleared
    if (!loadingScreen.querySelector(".content")) {
      loadingScreen.innerHTML = createLoadingScreenHTML();
    }
    return;
  }

  // Create loading screen element
  loadingScreen = document.createElement("div");
  loadingScreen.id = LOADING_SCREEN_ID;
  loadingScreen.innerHTML = createLoadingScreenHTML();

  // Insert at the beginning of body
  document.body.insertBefore(loadingScreen, document.body.firstChild);
}

// Hide loading screen with fade animation
function hideLoadingScreen() {
  const loadingScreen = document.getElementById(LOADING_SCREEN_ID);
  if (loadingScreen && !loadingScreen.classList.contains("fade-out")) {
    loadingScreen.classList.add("fade-out");
    // Remove from DOM after animation completes
    removalTimeout = setTimeout(() => {
      const screen = document.getElementById(LOADING_SCREEN_ID);
      if (screen) {
        screen.remove();
      }
      removalTimeout = null;
    }, 300);
  }
}

// Inject immediately when this module loads (for initial page load)
showLoadingScreen();

// Track previous ready state to detect transitions
let wasReady = false;

export default defineNuxtPlugin({
  name: "loading-screen",
  enforce: "pre", // Run before other plugins
  hooks: {
    // Use the app:mounted hook which fires after Pinia and other plugins are ready
    "app:mounted": () => {
      // Now we can safely use composables that depend on Pinia
      const appInit = useAppInit();

      // Watch for ready state changes
      watch(
        () => appInit.isReady.value,
        (isReady) => {
          if (isReady) {
            // App is ready - hide loading screen
            hideLoadingScreen();
            wasReady = true;
          } else if (wasReady) {
            // App was ready but now it's not (login/logout transition)
            // Show loading screen again
            showLoadingScreen();
          }
        },
        { immediate: true }
      );
    },
  },
});

// Export functions for manual control if needed
export { showLoadingScreen, hideLoadingScreen };
