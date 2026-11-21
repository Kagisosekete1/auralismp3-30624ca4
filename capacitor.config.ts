import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_LIVE_RELOAD=1 to point the native app at the Lovable sandbox (dev only).
// For Play Store / release builds leave it unset so the app loads the bundled `dist` build.
const useLiveReload = process.env.CAP_LIVE_RELOAD === '1';

const config: CapacitorConfig = {
  appId: 'com.semogrouptech.auralis',
  appName: 'Auralis',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  ...(useLiveReload
    ? {
        server: {
          url: 'https://b2261c56-b952-4091-923b-1fc314dea185.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }
    : {}),
};

export default config;
