---
name: releases-feed-from-followed-artists
overview: "Introduce a Releases feed that surfaces recent releases from artists a user follows on their connected providers. No provider exposes a native new-releases endpoint, so the feed is built by enumerating followed artists, querying each artist's albums, filtering by release date, and sorting. Backfill and refresh run via Vercel Cron against a new materialized store; the page reads only that store."
todos:
  - id: add-artist-releases-capability
    content: 'Add `catalog.artist.releases.read` capability ID, base method, and per-provider `_getArtistReleases` implementations + catalogs.'
    status: pending
  - id: add-persistence-models
    content: 'Add `FollowedArtist`, `Release`, `ReleaseArtist`, and `ArtistReleaseCursor` Prisma models + migration via changeset-ready migration list.'
    status: pending
  - id: add-cron-refresh
    content: 'Add Vercel Cron route and a refresh orchestrator (follow sync + watermark-short-circuited artist→releases fan-out).'
    status: pending
  - id: add-read-api-and-page
    content: 'Add `/api/v1/me/releases` route and a Releases page reading the materialized store.'
    status: pending
  - id: document-and-version
    content: 'Update harmony-engine README matrix, HARMONY_ENGINE_SPEC, feature flags, and add a changeset.'
    status: pending
isProject: false
---

# Releases Feed from Followed Artists

## Problem and finding

The product wants a page showing recent releases from artists a user follows across
their connected streaming provider(s). **No enabled provider exposes a native
new-releases endpoint:**

| Provider    | Followed-artists source                                       | Artist → releases                                                                     | Native "new releases"?               |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| Spotify     | `GET /me/following?type=artist` (`user-follow-read`)          | `GET /artists/{id}/albums` (`include_groups=album,single`, `market`) — app credential | No                                   |
| Tidal       | Saved artists (user collection)                               | Catalog `/albums` filtered by artist — app credential                                 | No                                   |
| Apple Music | **Library** artists (`/library/artists`, MusicKit user token) | `/artists/{id}/albums` (catalog, per storefront) — app credential                     | No                                   |
| MusicBrainz | N/A                                                           | `browse release?artist=MBID`                                                          | No (and no "newest-first" semantics) |

So "releases" must be computed as: enumerate followed artists → fetch each artist's
albums → filter by release date → sort descending. Doing that live per request fans
out N (hundreds/thousands) upstream calls per page view, which will trip rate limits
(Spotify is ~10 req/s for the catalog product). It must be precomputed.

## Key design decisions

1. **Materialize, don't fan out per request.** Introduce a snapshot store (Prisma) of
   followed artists plus their recent releases. The page reads only this store. The
   upstream fan-out happens in a background job, not on the request path.

2. **Incremental refresh via release-watermark short-circuit.** Providers return an
   artist's albums newest-first. On each refresh, walk albums until the release date
   is older than the stored per-artist watermark, then stop. Steady-state cost is
   proportional to _new_ releases, not to the number of followed artists. Only on the
   first backfill (or when an account is newly linked) is the full list pulled.

3. **Vercel Cron as the scheduler.** There is no queue/cron infra today. A Vercel
   Cron hitting a protected route is the smallest dependency. Fan-out runs are
   rate-limited and idempotent so a repeated tick is safe.

4. **Provider scope: Spotify + Tidal + Apple Music.** Apple is semantically "library
   artists" rather than "followed artists" (no follow graph); the UI labels it as such
   and the engine already routes Apple through `library.artists.read`.

5. **Artist→releases uses app credentials, not user tokens.** Only the _follow list_
   needs a user OAuth token. The heavy per-artist album queries use client credentials,
   so refresh does not depend on user-token health beyond the initial follow pull.

## Harmony engine changes

Add a new capability in the harmonization package (follow the README "Adding a
capability" checklist):

- Add `catalog.artist.releases.read` to `PROVIDER_CAPABILITY_IDS` in
  `packages/harmony-engine/src/types/provider.types.ts`.
- Add `_getArtistReleases(artistId, params)` and `getArtistReleases(...)` to
  `BaseProvider`, returning `PaginatedCollection<HarmonizedRelease>`, with a
  `GetArtistReleasesParams` shaped for `include_groups`/`market`/`storefront`.
- Implement in each adapter:
  - Spotify: `GET /artists/{id}/albums` → `transformAlbum` over returned albums.
  - Tidal: catalog `/albums` filtered by artist id (verify `/albums/byArtistId` or the
    `filter[artistId]` equivalent in the V2 API).
  - Apple Music: `/artists/{id}/albums` scoped to the configured storefront, mapping
    through `transformAlbum`.
  - MusicBrainz: leave `unsupported` in the capability catalog (browse exists but is
    not "releases by artist, newest-first").
- Add manifest descriptors to `SPOTIFY_CAPABILITY_MANIFEST`, `TIDAL_CAPABILITY_MANIFEST`,
  and `APPLE_MUSIC_CAPABILITY_MANIFEST`; add researched rows in
  `provider-api-support.ts`; update the README matrix.
- Consumers route through the existing dispatch pattern in
  `apps/web/src/lib/provider-capability-dispatch.ts`.

## Persistence (Prisma)

Add models in `packages/db/prisma/schema.prisma` (follow the existing snake_case
`@@map` convention) plus a migration:

- `FollowedArtist` — snapshot of a user's follows per provider:
  `updatedAt`, `provider`, `externalId`, denormalized `name`/`imageUrl`,
  `releaseWatermark` (last seen newest release date), `lastSyncedAt`. Unique on
  `(userId, provider, externalId)`.
- `Release` — a harmonized release row: `gtin` (nullable), `title`, `releaseDate`,
  `releaseType`, `artworkUrl`, `provider`, `externalId`, `raw` (Json snapshot), plus
  uniqueness on `(provider, externalId)`.
- `ReleaseArtist` — join between `Release` and `FollowedArtist` for the feed query.
  Indexed on `(followedArtistId, releaseDate)`.
- `ArtistReleaseCursor` — pagination/watermark state keyed by `(followedArtistId)`
  to make the short-circuit resumable if a cron run is interrupted.

## Refresh job (Vercel Cron)

- Add a route under `apps/web/src/app/api/cron/releases/route.ts` protected by a
  shared secret (matches Vercel's `CRON_SECRET` mechanism; see `docs/INFRA.md` for
  the existing secret pattern) and registered via `vercel.json` crons (daily).
- Orchestrator in `apps/web/src/lib/releases/refresh.ts`:
  1. Enumerate users with a linked Spotify/Tidal/Apple account (from `accounts`).
  2. For each provider account, refresh the follow snapshot using the existing
     `getFollowedArtistsFromProvider` path (user token) — upsert `FollowedArtist`.
  3. For each artist, fetch `getArtistReleases` (app credential), applying the
     watermark short-circuit; upsert `Release` rows and `ReleaseArtist` joins;
     advance `ArtistReleaseCursor`.
  4. Rate-limit to each provider's configured limit and make the run concurrency-safe
     (single-flight via a lock row or an idempotency key in `ArtistReleaseCursor`).

Note: identifies users-with-linked-accounts by scanning `accounts` where
`providerId in ('spotify','tidal','apple_music')`. This is O(users); with a large
user base, either constrain to recently-active users or index `accounts.providerId`.

## Read API and page

- `GET /api/v1/me/releases` — reads `ReleaseArtist`/`Release` joined against the
  user's `FollowedArtist` rows, ordered by `releaseDate desc`, paginated, filtered
  optionally by `provider`. No upstream calls.
- Releases page under `apps/web/src/app/(authenticated)/releases/` rendering the feed,
  reusing existing `platform-profile-card`/release-card primitives where possible and
  a feature flag (`@scilent-one/feature-flags`) to gate rollout.

## Open questions to resolve during implementation

- First-run backfill UX: does the page show a skeleton/empty state while the initial
  fan-out is still running? (Set an explicit `Backfill in progress` state keyed off
  `lastSyncedAt = null`.)
- Tidal has no server-side "newest-first" guarantee — confirm sort fields, else the
  watermark short-circuit needs a full-list sort for Tidal specifically.
- Spotify `include_groups=album,single` vs. `appears_on`: decide whether compilation
  appearances are in scope (likely exclude initially).
- Apple's storefront scoping means releases vary by storefront; pin the same
  storefront used elsewhere in the app.

## Verification

- harmony-engine: unit tests for `_getArtistReleases` per provider, manifest
  consistency, and capability-catalog matrix test.
- web: test the refresh orchestrator's watermark short-circuit (fixture albums
  newest-first), the read route against seeded `FollowedArtist`/`Release`, and the
  cron route's secret gate.
- Manual: link a Spotify test account, advance a fake "new release" in fixtures,
  confirm the feed updates after a cron tick without re-pulling unchanged artists.
- Run scoped `pnpm --filter @scilent-one/harmony-engine test`, web typecheck/lint, and
  a `pnpm db:migrate` dry-run.
