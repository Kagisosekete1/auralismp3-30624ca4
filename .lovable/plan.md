# Secure connection status in Settings

## What to build
- Add a connection status area to the existing Settings screen.
- Let the signed-in user manually check whether the app can reach its music data service.
- Show clear checking, connected, and unable-to-verify states with a retry action.
- Never render the service address, keys, tokens, or raw backend errors.

## Technical approach
- Make a minimal Supabase client `HEAD` query to the existing `tracks` table, requesting no rows or counts.
- Keep the check client-side and scoped to the existing authenticated Settings screen; do not add tables, secrets, or configuration fields.
- Use existing design tokens and shared button components; verify the status behavior and scan the newest preview build log.
