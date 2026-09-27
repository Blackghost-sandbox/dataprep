# Nila learning companion — V1

Nila adds a reference-inspired bottom-right character, dismissible contextual messages, and a keyboard-accessible floating panel. Existing lesson layouts, glossary cards and deep dives are unchanged.

## Reuse and behavior

- `CompanionProvider` receives the current lesson/tab directly from DataPrepApp. Shared SQL/Spark lessons publish hands-on drafts via `useCompanionExercise`; the separate RDD exercise publishes its own task/hints/solution.
- `AICompanionService` uses existing lesson content for explanations, SQL simplified concept guides, examples, progressive hints, and explicitly requested solutions. Mini-quizzes reuse lesson questions. There is no duplicate lesson catalog.
- `ReactionEngine` throttles unsolicited messages to one every 45 seconds across navigation. Messages disappear after 8 seconds; Quiet mode lasts for this app visit. Completion is accurately labeled self-reported. The app has no query runner, so Nila never claims to execute or validate a draft.
- Chat is memory-only, limited to eight displayed turns and four request-history turns, and resets on lesson changes. Static lesson responses have a 32-entry in-memory cache; code/error responses are never cached.
- Voice starts only when Play is clicked; pause/resume/replay/stop and speed are supported. Navigation, close and unmount stop playback. Browser/device voice availability varies; a browser may use its own remote speech engine if no local voice is available.
- One generated portrait is reused. Expressions use local badges and lightweight finite motion, not generated faces or lip-sync. Reduced-motion disables animation.

## AI integration boundary

No external AI provider is connected. Custom questions show a clear unavailable message, not a fabricated AI answer. Nothing is sent to an AI provider in V1. A future integration can instantiate `AICompanionService(new BackendCompanionTransport('/api/companion'))` instead of its default service.

Before enabling that endpoint, implement server authentication, authorization, rate limits, request size/schema validation, request cancellation, and server-side credentials. Treat submitted code, chat and lesson data as untrusted input, never as system instructions. Do not execute submitted code. Tell users when remote AI is enabled and which relevant draft data is being sent; change the current Local mode disclosure accordingly. Provider replies must remain text-only. The selector excludes unrelated lesson code, full progress, page HTML and roadmap data.

## Verification

Run `node scripts/check-companion.mjs`, `node scripts/check-sql-fundamentals.mjs`, `node scripts/check-sql-render.mjs`, and `node node_modules/typescript/bin/tsc --noEmit`.

Manual checks: open Nila with keyboard, Escape/minimize/close and focus restoration; expand at desktop/mobile viewport sizes; use every quick action; check a wrong then correct quiz option; edit SQL draft then ask a code question; change lessons while voice is playing; test unsupported speech and reduced-motion. No voice or AI request should start merely by navigating.

## Character asset

Saved asset: `public/nila-avatar.png`. Created with the built-in image-generation tool, not CLI. The transparent portrait matches the supplied lavender character direction without copying the surrounding UI.

Final generation prompt:

> Use case: stylized-concept. Asset type: DataPrep AI teacher avatar, a standalone website character illustration, NOT a screenshot or interface. Create Nila: friendly adult female learning companion with warm medium skin, long dark brown wavy hair, expressive brown eyes, smiling gently, wearing a lavender purple hoodie, one hand raised in a welcoming wave. Premium softly rendered 3D cartoon style consistent with the friendly teacher in the provided reference direction. Waist-up centered portrait, entire hair and hand in frame, generous margin. Genuine transparent background. Soft studio lighting, tasteful proportions, no text, no logos, no UI, no speech bubble, no watermark. The image will be reused in a small launcher and a compact white/purple tutoring panel.
