# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LiveKit Meet is an open-source video conferencing app built on [LiveKit Components](https://github.com/livekit/components-js), [livekit-client](https://github.com/livekit/client-sdk-js), and Next.js (App Router). It provides two entry flows: a **Demo** mode that generates random rooms, and a **Custom** mode that connects to any LiveKit server with a URL + token.

## Commands

- `pnpm install` — Install dependencies (pnpm is the package manager, pinned to 10.18.2)
- `pnpm dev` — Start Next.js dev server (localhost:3000)
- `pnpm build` — Production build
- `pnpm lint` / `pnpm lint:fix` — ESLint via Next.js config
- `pnpm test` — Run Vitest tests
- `pnpm format:check` / `pnpm format:write` — Prettier (single quotes, trailing commas, 2-space indent)

## Environment Setup

Copy `.env.example` to `.env.local`. Required:

- `LIVEKIT_API_KEY` — LiveKit API key
- `LIVEKIT_API_SECRET` — LiveKit API secret
- `LIVEKIT_URL` — WebSocket URL to LiveKit server (e.g. `wss://my-project.livekit.cloud`)

Optional: `S3_*` for recording, `NEXT_PUBLIC_SHOW_SETTINGS_MENU`, `NEXT_PUBLIC_LK_RECORD_ENDPOINT`, `NEXT_PUBLIC_DATADOG_*` for logging.

## Architecture

### Two Connection Flows

1. **Demo flow** (`app/page.tsx` → `/rooms/[roomName]`): Home page generates a random room ID, navigates to the room route. The room page (`app/rooms/[roomName]/PageClientImpl.tsx`) shows a PreJoin screen, fetches connection details from `/api/connection-details`, then connects.

2. **Custom flow** (`app/page.tsx` → `/custom`): User provides their own LiveKit server URL and token via a form. The custom page (`app/custom/VideoConferenceClientImpl.tsx`) connects directly without PreJoin or server-side token generation.

### API Routes

- **`/api/connection-details`** — Generates a participant access token server-side using `livekit-server-sdk`. Accepts `roomName`, `participantName`, and optional `region` query params. Sets a cookie for participant identity postfix.

- **`/api/record/start`** and **`/api/record/stop`** — Room recording via S3. These endpoints lack authentication and should not be used in production as-is.

### Client-Side Room Architecture

Both flows share the same pattern:
1. Create `Room` with `RoomOptions` (codec, simulcast, E2EE config)
2. Optionally set up E2EE via `ExternalE2EEKeyProvider` (passphrase read from URL hash)
3. Wrap UI in `RoomContext.Provider` → `RaisedHandsProvider` → `ReactionsProvider`
4. Render `VideoConference` (from `@livekit/components-react`) plus custom overlays

The inner UI composes: `KeyboardShortcuts`, `VideoConference`, `ReactionPicker`, `RaisedHandPopup`, `ReactionOverlay`, `RaisedHandOverlay`, `DebugMode`, and optionally `RecordingIndicator`.

### `lib/` Directory

Shared hooks and components used by both flows:
- **Hooks**: `useSetupE2EE` (reads passphrase from URL hash, creates SAB worker), `useReactions` (reaction state provider), `useRaisedHands` (hand-raise state provider), `useLowCPUOptimizer` (disables camera on low-power devices)
- **UI Components**: `ReactionPicker`, `ReactionOverlay`, `RaisedHandPopup`, `RaisedHandOverlay`, `SettingsMenu`, `CameraSettings`, `MicrophoneSettings`, `RecordingIndicator`, `Debug`, `KeyboardShortcuts`
- **Utilities**: `client-utils.ts` (room ID generation, passphrase encode/decode), `getLiveKitURL.ts` (region-based URL selection), `types.ts` (shared TypeScript types)

### Styling

CSS Modules in `styles/`. LiveKit Components provide their own styles via `@livekit/components-styles`. The `data-lk-theme="default"` attribute on root elements activates the LiveKit theme.

### E2EE

End-to-end encryption uses `ExternalE2EEKeyProvider` + SAB worker. The passphrase is encoded in the URL fragment hash (after `#`). When E2EE is enabled with vp9/av1 codec, the codec is unset because E2EE doesn't support those codecs.

### COOP/COEP Headers

`next.config.js` sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` on all routes — required for WebRTC features like SAB (E2EE) and screen sharing.

## Key Dependencies

- `@livekit/components-react` / `@livekit/components-styles` — React UI components for LiveKit
- `livekit-client` — Browser SDK for WebRTC connections
- `livekit-server-sdk` — Server-side token generation (API routes only)
- `tinykeys` — Keyboard shortcut bindings
- `react-hot-toast` — Toast notifications
