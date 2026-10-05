---
name: playlist provider enablement
overview: 'Document the current provider-backed playlist surface and implement it in capability-driven stages: read parity first, playlist details second, then only the write operations each provider actually exposes. The repository proves four built-in providers, but deployed enablement still needs an environment/database check because no deployment configuration is available in this workspace.'
todos:
  - id: verify-live-providers
    content: 'Verify deployed credentials, DB provider toggles, Spotify quota mode, and TIDAL access tier.'
    status: pending
  - id: playlist-read-parity
    content: 'Implement Spotify and TIDAL playlist listing, scopes/reconnect handling, tests, and profile/welcome UI.'
    status: completed
  - id: playlist-details
    content: 'Add granular playlist metadata/item contracts, provider adapters, APIs, and browse/detail UI.'
    status: pending
  - id: playlist-writes
    content: 'Implement capability-gated create/add and provider-specific mutation operations with secure server handlers.'
    status: pending
  - id: playlist-validation-docs
    content: 'Run automated and connected-provider validation, then update docs and package Changesets.'
    status: in_progress
isProject: false
---

# Playlist provider enablement

## Progress (as of 2026-08-18)

Phase 1 is implemented on
[`cursor/playlist-read-parity-6050`](https://github.com/donovanallen/scilent-x/tree/cursor/playlist-read-parity-6050)
in draft PR [#198](https://github.com/donovanallen/scilent-x/pull/198). CI, Vercel,
Changesets, unit tests, Storybook tests, lint, typecheck, and build are green.

- Spotify and TIDAL now declare and implement `library.playlists.read`.
- Spotify requests `playlist-read-private`; TIDAL requests `playlists.read`.
  Previously linked accounts are detected through `Account.scope` and prompted
  to reconnect for the added grant.
- The shared authenticated playlist route and server action now dispatch to
  Spotify, TIDAL, and Apple Music.
- Spotify and TIDAL profile cards show playlist previews alongside followed
  artists. Welcome-library counts now use real provider data and show
  `Unavailable` instead of treating unknown totals as ready.
- Provider fixtures cover response normalization, visibility filtering,
  pagination, and OAuth scope policy. Phase 1 validation passed 166
  harmony-engine tests and 127 web tests, plus both package typechecks and
  package-local lint/format checks.
- Connected-provider validation remains manual: a real Spotify/TIDAL user must
  complete OAuth consent, and the provider dashboards must confirm Spotify
  quota/user access and TIDAL third-party access. The local browser executor
  could not complete the seeded app login because the login form reloaded
  without sending an auth request; the app health endpoint and database were
  healthy, so that separate auth/hydration issue was not folded into Phase 1.

### Current application support

| Feature                              | MusicBrainz | Spotify         | TIDAL                         | Apple Music     |
| ------------------------------------ | ----------- | --------------- | ----------------------------- | --------------- |
| List current user's playlists        | —           | Implemented     | Implemented (owned playlists) | Implemented     |
| Paginated normalized metadata        | —           | Implemented     | Implemented                   | Implemented     |
| Profile playlist preview             | —           | Implemented     | Implemented                   | Implemented     |
| Welcome playlist count               | —           | Implemented     | Implemented                   | Implemented     |
| Playlist detail                      | —           | Not implemented | Not implemented               | Not implemented |
| Playlist tracks                      | —           | Not implemented | Not implemented               | Not implemented |
| Create or modify playlists           | —           | Not implemented | Not implemented               | Not implemented |
| Add a track from a context menu      | —           | Not implemented | Not implemented               | Not implemented |
| Dedicated playlist browse/detail UI  | —           | Not implemented | Not implemented               | Not implemented |
| Native Scilent persistence or mobile | —           | Not implemented | Not implemented               | Not implemented |

## Investigation conclusions

- “Enabled” has two meanings in this repository:
  - Built-in runtime providers are MusicBrainz, Spotify, TIDAL, and Apple Music
    in
    [`packages/harmony-engine/src/providers/index.ts`](packages/harmony-engine/src/providers/index.ts).
  - User-linkable providers are Spotify, TIDAL, and Apple Music in
    [`apps/web/src/lib/music-account-linking.ts`](apps/web/src/lib/music-account-linking.ts).
    Runtime activation additionally requires credentials and an enabled
    `ProviderSetting` row through
    [`apps/web/src/lib/harmonization.ts`](apps/web/src/lib/harmonization.ts).
  - Actual preview/production activation still needs a provider-dashboard and
    database check. Repository code and CI can prove capability wiring, not the
    deployed `provider_settings` rows or provider account approvals.
- Before Phase 1, the application supported only Apple Music playlist listing
  end to end. Phase 1 extends the same read contract to Spotify and TIDAL. The
  shared contract still represents a playlist summary rather than playlist
  contents.
- Spotify's current Web API supports current-user playlist listing,
  metadata/items, create, detail edits, add/remove/reorder/replace items, and
  cover images. Current-user listing needs `playlist-read-private`; writes need
  `playlist-modify-public` and/or `playlist-modify-private`, with
  `ugc-image-upload` only for custom covers. Development Mode is unsuitable for
  unrestricted launch: the app owner must be Premium, users must be
  allowlisted, and production scale requires Extended Quota approval.
- TIDAL's current third-party API supports owned-playlist listing
  (`GET /playlists?filter[owners.id]=me`), metadata/items,
  create/update/delete, and add/remove/reorder items with cursor pagination.
  Reads and writes use `playlists.read` and `playlists.write`. Broad production
  use also requires the appropriate TIDAL access tier/review, and playlist data
  should remain live rather than persisted unless TIDAL terms explicitly permit
  the proposed storage.
- Apple Music's public API supports list/get playlists, fetch tracks, create
  playlists, and append tracks using the existing Music User Token. It does not
  expose Spotify/TIDAL-equivalent rename, remove-track, reorder, or delete
  operations, so the UI must not imply full mutation parity.
- Core MusicBrainz has no playlist API. ListenBrainz has a separate playlist
  system, but it is not an enabled adapter or linked account and should be
  treated as a future provider rather than MusicBrainz functionality.
- Cross-cutting gaps are concentrated in
  [`packages/harmony-engine/src/types/provider.types.ts`](packages/harmony-engine/src/types/provider.types.ts),
  [`packages/harmony-engine/src/types/harmonized.types.ts`](packages/harmony-engine/src/types/harmonized.types.ts),
  provider adapters, and
  [`apps/web/src/components/harmony-interaction-provider.tsx`](apps/web/src/components/harmony-interaction-provider.tsx).
  There is no native playlist database model, dedicated playlist page,
  track-list contract, playlist URL parser, mobile flow, or working “Add to
  playlist” action.

## Recommended implementation

1. **Confirm the rollout boundary and live provider state.** Check deployment
   credentials/DB toggles and provider dashboard status. Keep the initial
   product provider-backed, web-only, and live-fetched; do not introduce native
   playlist persistence, mobile support, or ListenBrainz in this change.
2. **Deliver read parity first.** Add `library.playlists.read` to Spotify and
   TIDAL manifests and implement their paginated adapters. Map the required
   OAuth grants, include them in account-link scopes, and show an explicit
   reconnect flow for accounts linked under the old grants. Reuse the generic
   API/action path and pass playlist data into the Spotify and TIDAL profile
   cards; correct the welcome summary so unavailable data is not presented as
   ready. **Completed in Phase 1 / PR #198.**
3. **Model playlist details and tracks separately.** Add granular capability
   IDs and harmonized types for playlist metadata and playlist items, including
   provider ID/URI, owner, editability, collaboration/privacy, snapshot/version
   where applicable, item order, and pagination. Add base-provider methods and
   provider implementations for all three linkable services, then expose
   authenticated detail/item endpoints and a dedicated provider-aware playlist
   browse/detail UI. Extend URL parsing only for navigation/resolution; do not
   make playlists review subjects without a separate product decision.
4. **Add writes behind per-provider capability checks.** Introduce explicit
   capabilities for create, update, delete/unfollow, add, remove,
   reorder/replace, and optional cover upload. Implement Spotify's full
   supported set, TIDAL's third-party set, and Apple Music create/append only.
   Wire `add_to_playlist` in
   [`apps/web/src/components/harmony-interaction-provider.tsx`](apps/web/src/components/harmony-interaction-provider.tsx),
   with a target-provider/playlist picker, server-side ownership checks,
   idempotency/version handling, and provider-specific
   success/error/reconnect states. Hide impossible actions rather than
   disabling them generically.
5. **Verify and document the rollout.** Add provider fixture tests for
   transformations, cursor handling, scopes, capability guards, and mutation
   payloads; route tests for auth/ownership/provider errors; UI tests for
   capability-specific actions; and connected-account sandbox checks for each
   provider. Update the capability catalog/README/auth/beta docs and add
   Changesets for affected packages.

## Next stack

1. Complete the Phase 1 connected-account checks and confirm provider dashboard
   access. These are rollout gates, not blockers for beginning code-only Phase
   2 work.
2. Create the Phase 2 branch from `cursor/playlist-read-parity-6050`, with its
   PR based on the Phase 1 branch while #198 remains open.
3. Implement shared playlist detail/item types and capability IDs, then provider
   adapters and authenticated API routes.
4. Add a dedicated web playlist browse/detail surface and verify Spotify,
   TIDAL, and Apple Music pagination/empty/error states.
5. Start Phase 3 from the Phase 2 branch only after its contracts stabilize;
   keep native playlists, cross-provider transfer, mobile, and ListenBrainz in
   separate future initiatives.
