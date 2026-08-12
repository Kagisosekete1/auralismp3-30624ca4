# Auralis — Android app (Capacitor wrap)

Auralis is a React + Vite web app wrapped as a native Android app with Capacitor.
Nothing is rewritten — the same React code ships inside the Android shell.

## One-time setup (on your own machine)

1. Export the project to GitHub, then `git clone` it locally.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add the Android platform:
   ```bash
   npx cap add android
   npx cap update android
   ```

## Run on a device / emulator (development, hot reload from Lovable)

```bash
CAP_LIVE_RELOAD=1 npx cap sync android
npx cap run android
```

The app loads directly from the Lovable sandbox URL, so edits appear instantly.

## Build a real release app (Play Store)

```bash
npm run build          # builds dist/
npx cap sync android   # no CAP_LIVE_RELOAD -> bundles dist/ into the app
npx cap open android   # opens Android Studio
```

In Android Studio: Build > Generate Signed Bundle / APK > **Android App Bundle (.aab)**,
create/choose a keystore, and upload the `.aab` to Google Play Console.

Requirements: Android Studio + JDK 17.

## Notes for artists uploading music

- Uploading works best over Wi-Fi; large WAV/FLAC files are optimized before upload.
- The Android file picker opens the device **Files** app for audio, and Gallery/Files for cover art.
- Playback keeps lock-screen controls (title, artist, artwork, play/pause/next).

## App identity

- App ID: `app.lovable.b2261c56b9524091923b1fc314dea185`
- App name: `Auralis`
- Web assets folder: `dist`

Blog post on Capacitor mobile development with Lovable:
https://lovable.dev/blog/2025-05-14-building-mobile-apps-with-capacitor
