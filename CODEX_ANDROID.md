# What to tell Codex (Android APK build)

Copy/paste this brief:

> This is a React 18 + Vite + TypeScript web app (Auralis) wrapped with Capacitor 8.
> Do NOT rewrite it in React Native — keep the React web code and ship it as an
> Android app via Capacitor WebView. Tasks:
>
> 1. `npm install`, then `npx cap add android` and `npx cap update android`.
> 2. Build web assets: `npm run build` (outputs `dist/`), then `npx cap sync android`.
>    Leave `CAP_LIVE_RELOAD` unset so the app bundles `dist/` instead of the sandbox URL.
> 3. In `android/app/src/main/AndroidManifest.xml` add:
>    - `<uses-permission android:name="android.permission.INTERNET" />`
>    - `<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />` (Android 13+)
>    - `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />`
>    - `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />` (optional)
> 4. The app already uses `@capawesome/capacitor-file-picker` for Storage Access Framework
>    file selection (`src/lib/nativeFilePicker.ts`) — run `npx cap sync` so the plugin registers.
> 5. `applicationId` = `app.lovable.b2261c56b9524091923b1fc314dea185`, app name `Auralis`,
>    `minSdkVersion 24`, `targetSdkVersion 36`, JDK 17.
> 6. Debug APK: `cd android && ./gradlew assembleDebug` →
>    `android/app/build/outputs/apk/debug/app-debug.apk`.
>    Release AAB for Play: `./gradlew bundleRelease` with a signing keystore configured in
>    `android/app/build.gradle` (`signingConfigs.release`) and `keystore.properties`.
>
> If a true React Native rewrite is really wanted, that is a separate port: the UI
> (Tailwind classes, framer-motion, shadcn, DOM audio element) does not transfer —
> it would need NativeWind, Reanimated, react-native-track-player and a new
> navigation layer. Recommend Capacitor unless native modules are required.

## Which one do you actually want?

- **Capacitor (recommended, already set up):** same codebase, real APK/AAB, full
  Play Store distribution, file picker + audio playback working today.
- **React Native rewrite:** weeks of work, no benefit for a streaming/upload app
  of this shape.

## Mobile Upload Fix (Aug 2026)

`src/lib/nativeFilePicker.ts` uses the Android Storage Access Framework through
`@capawesome/capacitor-file-picker`, converts native file paths with
`Capacitor.convertFileSrc`, rejects unreadable zero-byte picks, and only allows
MP3, FLAC, and WAV audio.

`src/hooks/useDatabase.tsx` now requires a real signed-in session, sends an
explicit `Content-Type`, verifies that Supabase can see the uploaded object,
then probes the final public URL before inserting the track row. If the object
is missing or unplayable, the app fails the upload instead of saving a broken
song.
