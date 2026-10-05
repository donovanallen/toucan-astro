---
name: Friend listen rail — production implementation
overview: Deliver listening in staged milestones. Milestone 1 lets a signed-in user privately inspect their own live/recent activity through direct capability-gated provider reads. Milestone 1.5 reuses scilent-ui interactive track menus to start a prefilled review directly from a self-listening item, without persisting listening. Milestone 2 adds explicit publisher consent, bounded snapshots, authorized follow-graph reads, the approved Loop strip/menu, and the viewer chrome preference.
todos:
  - id: prototype-locked
    content: Preserve the approved Loop visual and interaction contract from the prototype
    status: completed
  - id: package-recon
    content: Verify current web, scilent-ui, social, Harmony, DB, and auth extension points
    status: completed
  - id: self-listening-contract
    content: Milestone 1 — implement Harmony live/recent capabilities and a private, non-persisted /listening self view
    status: completed
  - id: self-listening-verification
    content: Milestone 1 — verify provider capability, connection, scopes, empty/error states, and no cross-user or persistence paths
    status: completed
  - id: listening-review-initiation
    content: Milestone 1.5 — use scilent-ui track interactions to open the existing prefilled review composer from self-listening items
    status: completed
  - id: friend-privacy-launch-gate
    content: Milestone 2 — integrate publisher opt-in from issue 227; deny persistence and friend reads when unavailable
    status: pending
  - id: friend-persistence
    content: Milestone 2 — add bounded snapshots, sync state, and migration coverage (`showListenTicker` + Better Auth inference already shipped)
    status: pending
  - id: friend-social-projection
    content: Milestone 2 — add authorization-owning friend queries with deterministic ordering, expiry, pagination, and tests
    status: pending
  - id: listening-ui
    content: Move Loop presentation into scilent-ui with Storybook/a11y; web owns the private self page plus unmounted strip/menu/uncatalogued helpers
    status: pending
  - id: friend-web-surfaces
    content: Milestone 2 — mount consented Loop chrome and replace unmounted stub ListenChrome with the friend API
    status: pending
  - id: production-verification
    content: Complete package tests, Playwright flows, responsive/motion checks, observability, docs, changesets, and prototype cleanup
    status: pending
isProject: true
---

# Friend listen rail — production implementation

Implementation hand-off. The prototype at [`/prototypes/friend-listen-rail`](apps/web/src/app/prototypes/friend-listen-rail/) is the approved visual and interaction reference. Do **not** import from that route, copy its fake data, or make production components depend on it. Rebuild the behavior through the package boundaries below, then delete the prototype after visual parity is accepted.

Tracker: [Does the friend listen rail look and behave as intended?](https://github.com/donovanallen/scilent-x/issues/229). Map: [Explore: live listening activity across providers](https://github.com/donovanallen/scilent-x/issues/222).

## Current shipped state (milestone 1 private self view + self Loop strip + 1.5 menus)

Production ships the private owner `/listening` surface and mounts a **self-only**
Loop strip in authenticated chrome when `showListenTicker` is on. Self strip chips,
the listen dropdown, and `/listening` rows wrap a validated `HarmonizedTrack` with
Harmony context menus (Write review / Open in… / copy). Friend Loop chrome remains
unmounted. This is still not completion of the friend rail.

**In the app today:**

- Canonical `/listening` (`ROUTES.listening`, `showInNav: false`) is `SelfListeningPage`: title **Your listening**, live then recents, per-provider status. Copy is owner-private.
- `GET /api/v1/me/listening` aggregates the signed-in user’s Apple Music recents and Spotify recents/current playback (`Cache-Control: private, no-store`). No listening persistence.
- Settings → **Listening** card: `showListenTicker` switch (“Show my listening on Home”) plus a **View listening** link. The friends ticker label is not used yet.
- `ListenChrome` mounts under the header, fetches the self API when the ticker is on, and renders `ListenStrip` with `variant="self"` (no person/profile split-tap). Stub friend helpers remain unused.
- Harmony: Spotify implements `listening.recentlyPlayed.read` and `listening.nowPlaying.read`; Apple Music keeps recents with nullable `playedAt`; `HarmonizedNowPlayingItem` and `_getNowPlaying` exist. TIDAL/ListenBrainz listening remain unimplemented.
- `User.showListenTicker` exists in Prisma + Better Auth `additionalFields` (default **false**, opt-in) and controls the self strip; friend chrome will reuse the same field later.
- Home appends a dismissible listen-ticker onboarding card while the preference is off; `/listening` shows a top opt-in banner. Both require Spotify or Apple Music to enable.
- Prototype folder is still present; production components do not import it.
- Milestone 1.5: `ListeningTrackInteraction` wraps self-listening track content through
  `InteractiveWrapper` + `HarmonyInteractionProvider`. Primary click still opens the track.
  Incomplete/stub entities skip the menu. The global silent Write-review no-op (no ISRC/URL)
  is unchanged.

**Still this plan’s remaining work:** publisher privacy (issue 227), bounded snapshots, social follow-graph reads, and mounting consented **friend** Loop chrome (reuse `showListenTicker`; do not add a second field). Carry the same menu onto friend rows only when their projection has a validated track.

The milestone table below is the **target** architecture. Milestone 1’s “no ticker” row is satisfied: the real-data self view does not depend on Loop chrome. When milestone 2 mounts the strip, swap the unmounted stub helpers to authorized DTOs rather than duplicating chrome.

## Authoritative milestone split

The milestones are product/data boundaries, not just implementation phases. Milestone 1 must be useful and shippable without creating a latent friend-sharing pipeline. Milestone 1.5 turns a private listen into an explicit authored review flow while still storing no listening activity. Milestone 2 reuses those provider, review, and presentation contracts, then adds consented persistence and social distribution.

|                | Milestone 1 — **My listening**                                                                                                        | Milestone 2 — **Friends listening / Loop**                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| User value     | Signed-in user sees their own current/recent activity when a connected provider implements the capability and the provider is enabled | Signed-in viewer sees eligible followed users in the approved strip, menu, and page                                                            |
| Route          | `/listening` initially renders **Your listening**                                                                                     | `/listening` adds a **Friends** view/section without removing the self view; final information architecture gets visual sign-off before coding |
| Provider calls | Direct, self-scoped, request-time reads using only the current user’s tokens                                                          | Still self-scoped on write: an opted-in publisher refreshes their own snapshot; viewers read DB projections only                               |
| Persistence    | **None** for listening items, provider payloads, or sync state                                                                        | Bounded current snapshots + sync state, only after explicit publisher consent                                                                  |
| Social graph   | None                                                                                                                                  | Directed following intersected with the current publisher audience policy                                                                      |
| Privacy        | Existing self-only authorization; no new sharing behavior                                                                             | Issue 227 is a hard deny-by-default dependency                                                                                                 |
| Chrome         | No friend ticker/menu and no `showListenTicker` setting                                                                               | Approved 44px Loop strip/menu plus viewer `showListenTicker` setting                                                                           |
| Packages       | Harmony, auth scope derivation, scilent-ui self presentation, web self API/page                                                       | DB, auth viewer preference, social projection, scilent-ui friend variants, web self-sync/friend API/chrome                                     |

### Milestone 1 acceptance boundary

- “Supported and enabled” uses Harmony’s existing formula: implemented capability ∩ globally enabled/configured provider ∩ connected current-user account ∩ valid token/required grants. Do not add a second per-user listening toggle in milestone 1 unless product explicitly asks for one; connecting/reconnecting the provider is the user enablement boundary.
- Add one aggregated `GET /api/v1/me/listening` endpoint (or equivalent server loader) that composes the current user’s implemented, globally ready, connected, and sufficiently scoped providers.
- Return live and recent results separately, with per-provider capability/status metadata intended only for that account owner.
- Do not accept a user ID, username, account ID, or publisher target from the request.
- Do not create `ListeningSnapshot`, `ListeningSyncState`, a friend endpoint, a polling publisher component, a release gate for friend data, or the ticker preference yet.
- Do not show fake friends or reuse the prototype dataset. Unsupported/disabled/not-connected/reconnect-required providers produce honest owner-facing status or omission, never fabricated activity.
- `/listening` remains authenticated and private. Person/profile affordances designed for friend rows are omitted from the self view; the track/provider/status presentation is shared.
- Milestone 1 is complete only when tests prove no listening writes occur and another user’s tokens/data cannot be selected.

### Milestone 1.5 — initiate a review from listening

Milestone 1.5 adds no listening data model or new review mutation. It composes the interaction and review systems that already exist:

```text
Your listening item
  -> InteractiveWrapper(entityType="track", entity=harmonizedTrack)
  -> TrackContextMenu
  -> Write review
  -> HarmonyInteractionProvider.onWriteReview
  -> /reviews/new?isrc=...&type=TRACK
     or /reviews/new?url=<provider source>
  -> resolveReviewSubject
  -> ReviewComposer with initialSubject
  -> existing POST /api/v1/reviews only after explicit submit
```

Implementation contract:

- Preserve a validated `HarmonizedTrack` for each milestone 1 item; do not reduce the private self response to display strings that cannot drive `InteractiveWrapper`.
- Wrap the track portion of each self-listening row with `InteractiveWrapper` from `@scilent-one/scilent-ui`, using the existing app-level [`HarmonyInteractionProvider`](apps/web/src/components/harmony-interaction-provider.tsx). Do not add a second review router or a listening-specific review composer.
- Reuse `TrackContextMenu`’s existing **Write review** action and the host provider’s existing routing: prefer ISRC with `type=TRACK`; fall back to the first safe provider source URL.
- The action is available only when the track has a resolvable review identity (`isrc` or a supported source URL). Today `TrackContextMenu` renders the action whenever `onWriteReview` exists even if the callback cannot route; add a shared reviewability predicate/disabled reason so a listening item never offers a silent no-op.
- Keep the normal primary action: tapping/clicking track content opens track details or the honest uncatalogued state. Review initiation lives in the actions menu; do not turn the entire row into a “Write review” button.
- Preserve existing interaction adaptations: right-click/context-menu keyboard path on web; long-press plus the explicit actions trigger on touch. Ensure the trigger is discoverable, has an accessible name tied to the track, does not create nested interactive elements, and meets the listening row’s touch-target requirements.
- Opening the composer is not a review write. No `Post`/`ReviewSubject` is created until the user submits the existing `ReviewComposer`; cancellation leaves no review and no listening record.
- Resolver failure keeps the existing honest fallback to manual subject search. Never prefill a review with fabricated ISRC, provider URL, title, artwork, or artist data.
- Carry the same menu behavior into milestone 2 friend rows when their persisted projection has a validated review target. Friend-listening persistence must therefore retain enough normalized identity to reconstruct the interaction entity without storing a raw provider response.

Milestone 1.5 tests:

- `TrackContextMenu` invokes `onWriteReview('track', track)` for a reviewable listening entity.
- ISRC routes to `/reviews/new?isrc=...&type=TRACK`; missing ISRC with a safe source routes through `url=...`.
- Missing ISRC **and** source URL hides/disables review initiation with no silent callback.
- The review composer opens with the resolved subject, but no review POST occurs before submit.
- Keyboard context-menu invocation and touch actions trigger reach **Write review** without breaking the row’s track navigation.
- Cancelling/backing out leaves no review and milestone 1 still performs no listening writes.

### Milestone 2 acceptance boundary

- Add persistence only after the publisher has explicitly enabled sharing under issue 227’s policy.
- Publisher refresh remains self-owned: provider calls execute in the publisher’s authenticated context and write only that publisher’s bounded projection.
- Add policy-safe social reads, then the approved Loop strip/menu and Friends content on `/listening`.
- Preserve **Your listening** as the owner’s capability/reconnect diagnostic. A provider can therefore be visible to its owner in milestone 1 while remaining absent from friends because sharing is off, the audience does not match, or the snapshot is stale.
- The exact `/listening` presentation for **Your listening** alongside **Friends** (sections, tabs, or another restrained pattern) is the only new visual decision required. Prototype/review it before milestone 2 UI implementation; do not silently replace the approved Friends page with an unreviewed tab system.

## Chosen milestone 2 design — Loop

Three layers, same row type:

1. **Strip (home and every chrome surface)** — ~44px under the page header. Not in the post column. Does not compete with onboarding / guidance cards.
2. **Menu (right of the strip)** — Popover list. Keyboard and screen-reader path. Replaces a separate **All** control; “See all listening” lives at the bottom of this menu and opens the page.
3. **Page (canonical)** — Dedicated listening route. Two sections, full list.

### Strip

- Ambient marquee of capability-shaped chips (person | artwork + title + artist + optional time + provider mark).
- **Split-tap is pointer-only on the strip.** Person → profile; art/title → `/tracks/{isrc}` or an honest “not in catalog” placeholder. No play-from-rail.
- Strip chips are not in the tab order (`aria-hidden` track). Focusable controls: **Pause** (when the loop is allowed) and the **menu trigger**.
- Loop motion: CSS `transform` + `linear`, pause/play control (WCAG 2.2.2), pause while the menu is open or the tab is hidden, pause on hover/focus-within for fine pointers.
- **Touch (`pointer: coarse`) and `prefers-reduced-motion`:** no auto-scroll. Same chips in a user-flick snap scroller.
- Pause control is omitted when auto-scroll is off (touch / reduced motion).
- Menu trigger sits on the **right**, `border-l`, `align="end"` popover. Faces always; count/label from `@min-[24rem]` on the strip container. Chevron. 44×44 minimum hit target.

### Menu

- Sections: **Listening now** (omit heading if empty), then **Recently played**.
- Same split-tap as the page (real buttons).
- **See all listening** only when the user is on home; hidden on the dedicated page.
- Provider marks stay secondary (quiet `PlatformBadge`, icon in the strip, fuller label in roomy rows).

### Page

- Title **Listening**. Full live then recents lists. Same degrade rules as the menu.

## Locked product decisions

From [What is the first live-activity product surface?](https://github.com/donovanallen/scilent-x/issues/226), **updated by this prototype**:

| Decision                    | Locked answer                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Headline surface            | **Rail first** (experience A). Not mixed into home-feed **posts**.                                                                        |
| Home placement              | **Ticker strip under header**, not a 3–5 row list above posts. Onboarding/guidance keeps the masthead.                                    |
| Dedicated                   | Canonical full-page list.                                                                                                                 |
| Intermediate                | **Right-side menu** on the strip (not a left cluster, not a separate All button).                                                         |
| Motion                      | Loop on fine pointer + motion allowed; snap scroller otherwise.                                                                           |
| Sections                    | **Two sections**: “Listening now”, then “Recently played”.                                                                                |
| Empty live                  | **Omit the live heading** when nothing is live.                                                                                           |
| Row contents                | Person, **artwork**, title, artist, **relative time if `playedAt`**, **provider mark**.                                                   |
| Live treatment              | Copy **“Listening now”**, not an avatar badge.                                                                                            |
| Tap                         | **Split**: person → profile; artwork/title → track. No play-from-rail.                                                                    |
| Capability policy           | One row type. Fields appear when the provider can fill them. Not a Spotify-only widget.                                                   |
| Profile later               | Compact recents only — **not this work**.                                                                                                 |
| Avatar / now-playing badges | **Tabled**.                                                                                                                               |
| Home-feed mix-in (B)        | **Out**.                                                                                                                                  |
| Ticker visibility           | **Viewer setting** (this slice). Distinct from **publisher privacy** ([issue 227](https://github.com/donovanallen/scilent-x/issues/227)). |

## Provider / profile adaptability

- Same slots for Spotify (live + `playedAt`), Apple (recents, **no clock**), ListenBrainz (live and/or `listened_at`), future Tidal if those fields exist.
- Omit empty slots: no timestamp placeholder for Apple recents; no live section if nobody is live; missing art uses the muted track fallback; missing ISRC opens a non-entity placeholder.
- Live-only friends disappear from the rail when the dataset has no live (they have nothing to show).
- Provider mark is the connected source on **that row**, quiet, never a progress bar unless a later grill reopens “live richness”.

## Prototype coverage to preserve

The current prototype covers home/page placement, a live + recent mix, no-live behavior, missing artwork, missing ISRC, Apple recents without timestamps, provider marks, split destinations, coarse-pointer scrolling, reduced motion, and the menu/page hierarchy. Convert those states into Storybook fixtures and automated tests before removing the prototype.

## Platform facts (do not implement in the spec folder)

- [`docs/research/harmony-listening-capability-gaps.md`](docs/research/harmony-listening-capability-gaps.md)
- [`docs/research/provider-listening-api-contracts.md`](docs/research/provider-listening-api-contracts.md)
- [`docs/research/social-feed-listen-activity-fit.md`](docs/research/social-feed-listen-activity-fit.md)

Harmony today: Spotify implements recently-played and now-playing; Apple Music recently-played with optional `playedAt`; `GET /api/v1/me/recently-played` and `GET /api/v1/me/listening` are self-only.

## Viewer setting — ticker on/off (milestone 2)

This is **“I don’t want to see the strip”**, not **“what I share.”** Sharing/privacy (who can see my live vs recents, per-provider, hide from others’ rails while still logging) is [issue 227](https://github.com/donovanallen/scilent-x/issues/227) and **out of this slice**. Do not spec those controls here.

**Already shipped (do not duplicate):** `User.showListenTicker Boolean @default(false)` and Better Auth `additionalFields.showListenTicker` (`input: true`, default false). Settings **Listening** already has the ticker switch (“Show my listening on Home”) plus a **View listening** link. Authenticated chrome mounts the self Loop strip when the preference is explicitly on. Milestone 2 should reuse this field for friend chrome — not a second column or second Settings card.

**Off:** no strip on chrome surfaces, no marquee, no right-side listen menu. Page chrome under the header looks as it does today. The dedicated **Listening** page still exists and still lists live + recents; this toggle does not hide other people’s activity from the canonical page. Put a text link to that page in the same settings card so it stays reachable when the chrome entry point is gone. Do not add a leftover icon/chip on home.

**Open (do not invent in this slice):** whether Listening also needs a persistent nav item (always, or only when the ticker is off). Default for v1 is **settings link only** unless a later grill says otherwise.

**Later (not this slice):** granular sharing — live vs recents, audience, per-provider, “log but don’t appear on rails.” Point implementers at issue 227; do not design those UIs now.

## Milestone 2 production safety gate

Provider recently-played remains self-only in production APIs. `GET /api/v1/me/recently-played`, `GET /api/v1/me/listening`, and the Apple profile card deliberately refuse cross-user reads. Authenticated chrome mounts a **self-only** Loop strip when `showListenTicker` is on; stub friend helpers remain unmounted. A viewer following someone is **not** consent to collect or publish that person’s listening.

The rail may be implemented behind a disabled release gate, but it must not return, refresh, or render another user’s listening until [publisher privacy issue 227](https://github.com/donovanallen/scilent-x/issues/227) provides an explicit, deny-by-default eligibility decision. Keep the privacy UI and audience design in that issue; consume its server-side policy here.

Required integration contract:

- `@scilent-one/social` owns the final cross-user authorization check. It must not export an unfiltered “all snapshots” friend query.
- Snapshot refresh checks publisher eligibility before every provider call and again before writing.
- Read queries join/check the **current** publisher policy, so switching sharing off removes the publisher immediately even if a snapshot remains.
- Revocation deletes or quarantines the publisher’s snapshots. Account disconnect and user deletion cascade them.
- Tests prove that follow-without-opt-in, revoked opt-in, expired live presence, blocked audience, and direct API calls all return no item.
- If the privacy contract is not available when this plan is implemented, keep the route and shell entry behind a server-side release flag that defaults off in every deployed environment. Do not substitute “public profile” or post visibility.

The viewer’s `showListenTicker` preference is separate. It controls only the viewer’s strip/menu and never authorizes publishing, collection, or the dedicated page.

## Scope

### In scope

- Provider-neutral recent and now-playing reads needed by the web feature.
- Spotify recent + current playback and the existing Apple Music recents implementation.
- A bounded, denormalized current snapshot per publisher and kind; no permanent listen archive.
- Directed follow-graph projection (“people I follow”), current publisher-policy enforcement, and stable pagination.
- App-shell strip/menu, canonical `/listening` page, viewer setting, loading/empty/stale/error states, responsive behavior, motion controls, and accessible destinations.
- Opportunistic publisher refresh while that opted-in publisher has the Scilent web app active. Viewer reads never fan out to provider APIs.
- Package tests, Storybook, Playwright, docs, observability, migration review, and Changesets.

### Out of scope

- Designing publisher controls or audience semantics from issue 227.
- Home-feed posts, `Activity` notification fan-out, likes/comments/reposts, ranking, or play-from-rail.
- Profile recents, avatar status badges, OS Live Activities, playback progress UI, or provider-specific row layouts.
- ListenBrainz adapter/account linking and unsupported TIDAL listening APIs. The contracts must allow later adapters without UI redesign.
- A durable listening-history warehouse or analytics use of provider data.
- Mobile UI. Shared package contracts should remain usable by a later mobile implementation, but this plan ships web only.

## Locked implementation decisions

1. **Self first, without storage.** Milestone 1 reads only the current user’s provider data at request time and renders it privately. It writes no listening rows.
2. **Snapshot, never viewer fan-out.** In milestone 2, `GET /api/v1/listening/friends` reads PostgreSQL only. It never loads friends’ OAuth tokens or calls providers.
3. **Presence-assisted refresh.** An opted-in publisher’s own visible web session calls a self-sync endpoint on load/focus and at a conservative interval. Polling stops when the document is hidden. “Listening now” expires quickly when refresh stops. This scales with active publishers, not viewers × follows, and avoids service-account token refresh.
4. **Bounded state.** Milestone 2 stores at most one `NOW_PLAYING` and one `RECENT` snapshot per user, plus small per-account/per-capability sync state. The Friends page is the full set of followed people with a current item, not an archive of every play.
5. **Distinct Harmony entities.** Do not overload `HarmonizedListenHistoryItem` with live state. Add a separate now-playing type and nullable operation in milestone 1.
6. **One social DTO.** Provider payloads stop at Harmony; Prisma records stop at social. Web and scilent-ui consume a stable `FriendListenItem` in milestone 2.
7. **Server-authoritative first paint.** The milestone 2 authenticated layout passes the viewer’s ticker preference into `AuthenticatedShell`; do not flash the strip and remove it after hydration.
8. **No hidden network work.** When the viewer turns the ticker off, the shell does not request friend data. Publisher self-sync remains independently governed by publisher consent.
9. **Graceful absence beats synthetic data.** Unknown timestamps, unavailable providers, missing art, and missing ISRC omit only the unsupported affordance. Never invent a clock, catalog identity, or “live” state.

## End-to-end architecture

Milestone 1:

```text
signed-in user opens /listening
  -> GET /api/v1/me/listening
  -> current session user only
  -> implemented + globally enabled capability discovery
  -> current user's connected accounts and scope/token validation
  -> Harmony live/recent reads (bounded parallel calls)
  -> private response + Your listening UI
  -> no listening persistence
```

Milestone 2:

```text
opted-in publisher's visible web session
  -> POST /api/v1/me/listening/sync
  -> session + publisher-policy check
  -> current user's connected accounts only
  -> token/scope validation
  -> Harmony capability dispatch (bounded parallel calls)
  -> normalize + choose one live and one recent candidate
  -> transactional snapshot upsert/expiry + sync-state update

signed-in viewer
  -> GET /api/v1/listening/friends
  -> social query applies directed follows + current publisher policy
  -> live expiry + deterministic ordering + cursor pagination
  -> FriendListenItem DTO
  -> shell strip/menu or canonical page
```

Keep orchestration in `apps/web`: it is the only layer that should coordinate session auth, token lifecycle, Harmony, social policy, HTTP caching, and Next.js runtime behavior. Milestone 1’s response is a private provider result; milestone 2 maps successful self results into snapshots and then a social DTO. Do not make `packages/social` depend on Harmony/auth or make Harmony depend on Prisma.

## Milestone 1 self-listening contract

Define a web-owned response schema under `apps/web/src/lib/listening/self-types.ts`:

```ts
import type {
  HarmonizedTrack,
  ProviderSource,
} from '@scilent-one/harmony-engine';

type SerializedProviderSource = Omit<ProviderSource, 'fetchedAt'> & {
  fetchedAt: string;
};
type SerializedHarmonizedTrack = Omit<HarmonizedTrack, 'sources'> & {
  sources: SerializedProviderSource[];
};

interface SelfListeningResponse {
  live: SelfListenItem[];
  recent: SelfListenItem[];
  providers: Array<{
    provider: string;
    live: 'ready' | 'unsupported' | 'disabled' | 'not_connected' | 'reconnect';
    recent:
      'ready' | 'unsupported' | 'disabled' | 'not_connected' | 'reconnect';
  }>;
  fetchedAt: string;
}

interface SelfListenItem {
  id: string;
  kind: 'now_playing' | 'recent';
  track: SerializedHarmonizedTrack;
  provider: string;
  playedAt: string | null;
  observedAt: string;
}
```

- Provider statuses are owner-facing capability/connectivity guidance, not errors exposed to friends later.
- Live/recent results may include one item per usable provider so the owner can verify each connection. Milestone 2 applies its own deterministic winner policy before persisting the bounded friend projection.
- Return `Cache-Control: private, no-store`. A refresh repeats direct self reads; SWR may deduplicate concurrent components but must not persist provider responses in browser storage or a shared server cache.
- Partial provider failure returns successful items from other providers plus a redacted status. The endpoint fails only for auth/validation or a total application/database failure.
- Serialize the validated normalized `HarmonizedTrack`, not raw provider JSON. The bounded private response needs its ISRC/sources so milestone 1.5 can use the existing interaction menu and review resolver. The client parses it through `HarmonizedTrackSchema` to restore dates and reject malformed entities before passing it to `InteractiveWrapper`.
- Track navigation and field-degradation rules match the future friend row. No friend identity, follow data, publisher audience, or viewer preference appears in this response.

## Milestone 2 friend product contract

Add the social-facing contract under `packages/social/src/listening/types.ts` and export it from `@scilent-one/social`:

```ts
type FriendListenKind = 'now_playing' | 'recent';

interface FriendListenItem {
  id: string;
  kind: FriendListenKind;
  friend: {
    id: string;
    name: string | null;
    username: string;
    avatarUrl: string | null;
    image: string | null;
  };
  track: {
    title: string;
    artistLabel: string;
    artworkUrl: string | null;
    isrc: string | null;
  };
  reviewTarget:
    { kind: 'isrc'; value: string } | { kind: 'url'; value: string } | null;
  provider: string;
  playedAt: string | null;
  observedAt: string;
}

interface FriendListeningPage {
  live: FriendListenItem[];
  recent: FriendListenItem[];
  nextCursor: string | null;
  hasMore: boolean;
  generatedAt: string;
}
```

Contract rules:

- `username`, `title`, `artistLabel`, `provider`, and timestamps are sanitized/normalized server-side; items without a routable username or meaningful track title are dropped.
- `playedAt` is nullable and omitted visually when unknown. `observedAt` is freshness metadata, not a user-facing substitute for `playedAt`.
- `reviewTarget` prefers a normalized ISRC, otherwise a validated supported-provider source URL. It is `null` when review prefill cannot be resolved; the menu must then omit/disable **Write review**.
- `id` identifies the snapshot projection and is stable until the publisher’s selected track/kind changes.
- The API serializes dates to ISO strings and returns only display/navigation fields. It never returns provider account IDs, external provider user IDs, token state, sync errors, raw provider payloads, or privacy settings.
- Live and recent arrays never contain the same publisher at once. A valid live item wins; its recent item becomes visible again only after live expiry.

## `packages/db` — milestone 2 bounded persistence

Modify [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma) and add a generated migration. Use names consistent with the final privacy schema from issue 227.

### Viewer preference

**Already present:** `User.showListenTicker Boolean @default(false)` (migrations `20260828000000_add_user_show_listen_ticker` and `20260904220000_listen_ticker_opt_in`). Do not add a second listening preference. Do not add publisher privacy fields here unless implementing issue 227 in the same coordinated change.

**App-wide gate (separate from viewer opt-in):** `listen_ticker_v2` in `@scilent-one/feature-flags` + `FeatureFlag` rows (`docs/FEATURE_FLAGS.md`). v2 UI should require both the global flag and `showListenTicker` where appropriate.

### Snapshot

Add a `ListeningSnapshotKind` enum (`NOW_PLAYING`, `RECENT`) and a `ListeningSnapshot` model with:

- cuid `id`; `userId`; required `accountId`; `providerId`; `kind`.
- `providerItemId`, nullable `isrc`, nullable validated `sourceUrl`, `title`, `artistLabel`, nullable `artworkUrl`, and a deterministic `fingerprint`.
- nullable `playedAt`; `observedAt`; `firstObservedAt`; internal `sortAt`; nullable `expiresAt`.
- `createdAt @default(now())` and `updatedAt @updatedAt`.
- both `User` and `Account` relation fields, with matching relation arrays on those models and cascade behavior for user/account deletion.
- `@@unique([userId, kind])`, `@@index([kind, expiresAt])`, and `@@index([kind, sortAt, id])`.

The sync writer evaluates every usable connected provider, then transactionally upserts the winning live/recent candidates. A provider refresh must not independently race another provider and overwrite a better candidate.

Use `onDelete: Cascade` for the required account relation. Disconnecting the winning source therefore removes its snapshot immediately; the next eligible self-sync may repopulate from another connected provider.

`fingerprint` selection: normalized ISRC first; otherwise provider + provider item ID; otherwise provider + normalized title + artist. For a timestamp-less provider, preserve `firstObservedAt`/`sortAt` while the fingerprint is unchanged so repeated Apple polling does not keep moving the same track to the top. A new fingerprint resets those values. `sortAt` is `playedAt` when trustworthy, otherwise first observation time; it is never displayed as a fake play time.

### Sync state

Add `ListeningSyncState`, unique on `[accountId, capability]`, with `lastAttemptAt`, `lastSuccessAt`, `nextAttemptAt`, nullable `leaseUntil`, `consecutiveFailures`, nullable redacted `lastErrorCode`, and standard timestamps. Add indexes for selecting eligible work. This gives retries/backoff and future worker/queue support without putting operational fields on `Account`.

Do not persist access tokens, raw provider payloads, progress, devices, or provider error bodies in listening tables. `sourceUrl` is normalized review/navigation identity, not a raw payload; allow only HTTPS URLs from supported provider hosts. The bounded invariant is at most two snapshots per user and two sync-state rows per listening-capable account.

Migration procedure:

1. Run `pnpm db:generate`.
2. Create a descriptively named migration with `prisma migrate dev --create-only`.
3. Review generated SQL for defaults, indexes, foreign keys, and non-destructive rollback.
4. Test it against a dedicated development/staging database only; never write to production from an agent environment.
5. Verify account/user deletion and privacy revocation cleanup.

## `packages/auth` — milestone 1 scopes, milestone 2 viewer preference

Spotify capability additions in Harmony expand `getProviderOAuthLinkScopes('spotify')`, which [`packages/auth/src/server.ts`](packages/auth/src/server.ts) already consumes. Existing linked accounts remain usable for old features but report reconnect for missing listening grants.

**Already present:** `showListenTicker` is registered in [`packages/auth/src/server.ts`](packages/auth/src/server.ts) as a Better Auth boolean additional field with `defaultValue: false` and `input: true`. Settings and the self Loop shell are already wired to this field; do not register a second preference.

Security boundaries:

- Do not expose publisher privacy as a client-writable Better Auth field unless issue 227 explicitly chooses that contract.
- Keep provider token retrieval server-only. Never place friends’ tokens or provider account rows in the session/API.
- Existing Spotify links will lack the new listening scopes. Scope validation must return `INSUFFICIENT_SCOPE`, and settings should ask the account owner to reconnect; do not treat an old token as authorized.

Settings persistence is confirmed, not fire-and-forget: optimistically update the switch, await `authClient.updateUser`, roll back and toast on failure, then refresh/mutate the session so the server-authored shell updates without a full sign-out.

## `packages/harmony-engine` — milestone 1 provider-neutral listening

### Types and base operation

In [`packages/harmony-engine/src/types/harmonized.types.ts`](packages/harmony-engine/src/types/harmonized.types.ts), add:

```ts
interface HarmonizedNowPlayingItem {
  track: HarmonizedTrack;
  provider: string;
  observedAt: Date;
  providerStateChangedAt?: Date;
  isPlaying: boolean;
  progressMs?: number;
  durationMs?: number;
}
```

Export its Zod schema/type from [`packages/harmony-engine/src/types/index.ts`](packages/harmony-engine/src/types/index.ts) and the package root. `progressMs` and `durationMs` make the adapter contract future-compatible but remain out of the rail DTO/UI.

Extend [`packages/harmony-engine/src/providers/base.provider.ts`](packages/harmony-engine/src/providers/base.provider.ts):

- Map `listening.nowPlaying.read` to `_getNowPlaying`.
- Add protected unsupported `_getNowPlaying` and public `getNowPlaying(accessToken): Promise<HarmonizedNowPlayingItem | null>`.
- Keep capability assertion, rate limiting, retry, and operation timeout behavior identical to other optional operations.
- Correct the existing `_getRecentlyPlayed` unsupported error ID from `library.recentlyPlayed.read` to `listening.recentlyPlayed.read`.

Add capability-driven dispatch helpers in [`apps/web/src/lib/provider-capability-dispatch.ts`](apps/web/src/lib/provider-capability-dispatch.ts); never branch on concrete provider classes.

### Spotify

In [`packages/harmony-engine/src/providers/spotify.provider.ts`](packages/harmony-engine/src/providers/spotify.provider.ts):

- Declare and implement `listening.recentlyPlayed.read` with `user-read-recently-played`.
- Declare and implement `listening.nowPlaying.read` with the least privilege that also lets the adapter suppress private sessions. Prefer playback-state data if the currently-playing endpoint cannot prove private-session status.
- Map tracks only. Episodes, ads, unknown items, 204/no content, paused playback, and private sessions yield `null` for the product’s now-playing candidate.
- Preserve provider item ID, ISRC, artists, artwork, duration, `played_at`, provider-state timestamp, and progress where supplied.
- Respect endpoint caps, cursor semantics, `Retry-After`, shared timeout/retry rules, and never log response bodies or tokens.

Update [`packages/harmony-engine/src/types/provider-oauth-scopes.ts`](packages/harmony-engine/src/types/provider-oauth-scopes.ts) so link scopes are derived from the newly implemented capabilities. Add reconnect coverage for old grants.

### Other providers

- Keep Apple Music recent behavior and nullable `playedAt`; do not claim server now-playing.
- Keep TIDAL listening capabilities unsupported until a public contract exists.
- Keep ListenBrainz in the API capability catalog only. A future adapter can implement the same two methods and add an account-linking strategy without changing social/UI contracts.

Update the checked capability matrix/readme and `agents/HARMONY_ENGINE_SPEC.md`. Cover schema validation, base guards, truthful manifests, mappings, 204/paused/private/429/error paths, pagination, and OAuth scope derivation.

## `packages/social` — milestone 2 authorization and projection

Create `packages/social/src/listening/` with `types.ts`, `queries.ts`, `index.ts`, and tests; export only policy-safe entry points from [`packages/social/src/index.ts`](packages/social/src/index.ts).

Recommended API:

```ts
getFriendListening(
  viewerId: string,
  params?: { limit?: number; cursor?: string; surface?: 'rail' | 'page' }
): Promise<FriendListeningPage>
```

Query requirements:

- Directed graph: publisher must be a user where `Follow.followerId === viewerId` and `Follow.followingId === publisher.id`. Do not include the viewer automatically and do not require mutual follow unless issue 227 chooses that audience.
- Apply the current publisher policy inside the query/service, not in the route after reading rows.
- Ignore `NOW_PLAYING` rows with `expiresAt <= now`; then suppress the same publisher’s `RECENT` row while valid live exists.
- Sort live by `observedAt desc, id desc`; sort recent by `sortAt desc, id desc`. Reuse `encodeTimeIdCursor` / `decodeTimeIdCursor` from `packages/social/src/utils/pagination.ts`, wrapping a versioned section discriminator when pagination crosses from live into recent; keep the unique ID tie-breaker.
- Rail/menu projection is bounded (recommended 12 display items, with at most one row per publisher). The page uses 20–50 item pages. Clamp all caller limits server-side.
- Select only DTO fields; avoid loading accounts, tokens, privacy internals, or raw model objects.
- Return an empty successful result when the viewer follows nobody or nobody is eligible. Provider failures are not a social query concern because reads use last-known snapshots.

Do not reuse `Post`, `PostType`, or `Activity`: those models imply authored/commentable content or notification fan-out and have no correct track/privacy payload.

Tests must mock Prisma at the package seam and cover follow direction, policy decisions, live expiry, live-over-recent suppression, null timestamps/artwork/ISRC, deterministic ties, cursor validation, clamped limits, revocation, and query field selection.

## `packages/scilent-ui` — reusable presentation and milestone 1.5 interactions

Create `packages/scilent-ui/src/components/listening/` and export it through package barrels. Keep all data access, host routing, polling, friend-list popover ownership, and privacy logic out of this package. Reuse the package’s existing entity interaction menus rather than duplicating them in listening components.

Components:

- `SelfListeningList` (or a generic list composition) for milestone 1, without a redundant person/profile target.
- `ListeningRow` with `compact` and `roomy` densities, a person action and a track action, optional time, quiet provider mark, and real `UserAvatar`/`Artwork`.
- `ListeningStripChip` for the 44px visual chip. It accepts callbacks/links but does not own marquee behavior.
- `ListeningRowSkeleton` and `ListeningEmptyState` for the canonical page.
- `ListeningTrackInteraction` (or direct composition) that passes a validated `HarmonizedTrack` through `InteractiveWrapper entityType="track"` without nesting buttons/links.
- A shared `isTrackReviewable` predicate used by `TrackContextMenu` and the host review router so **Write review** is never a silent no-op.
- A small pure mapper/formatter only if it is presentation-specific; accept a stable `now` value so SSR/hydration does not disagree about relative time.

Use a minimal view model rather than importing Prisma or the full social result. `packages/scilent-ui` already depends on Harmony and UI; it must not add a dependency on `@scilent-one/social`.

Stories/fixtures must cover live Spotify, timestamped recent Spotify, timestamp-less Apple, text-only unknown provider, missing artwork, missing ISRC, reviewable-by-ISRC, reviewable-by-source-URL, non-reviewable, long names/titles, null display name, compact/roomy, loading, empty, narrow containers, dark mode, high contrast, reduced motion, and RTL-safe truncation. Add interaction/a11y assertions for split actions, actions-menu access, review invocation, and labels.

Reuse `PlatformBadge`, `ProviderIcon`, `UserAvatar`, and `Artwork`. Do not invent provider colors, generated album gradients, or a ListenBrainz icon. Unknown providers degrade to a quiet text mark.

## `apps/web` — milestone-specific orchestration and surfaces

### Milestone 1 self endpoint and page

Add `GET /api/v1/me/listening` under the existing self-scoped namespace:

- Authenticate with `getCurrentUser()` and derive the only allowed target from that session.
- Discover implemented/globally ready `listening.nowPlaying.read` and `listening.recentlyPlayed.read` capabilities rather than maintaining a separate provider truth table.
- Load only the current user’s connected accounts, validate each token/scope with `getFreshAccessToken`, and start independent provider/capability calls together with a small concurrency cap.
- Map Harmony output into `SelfListeningResponse`; isolate provider failures and return owner-facing reconnect/unsupported/disabled states without leaking token details.
- Set `Cache-Control: private, no-store`. Do not call Prisma create/update/upsert for listening data.

Build `/listening` first as the private **Your listening** page:

- Show “Listening now” when available, then “Recently played”; group or mark rows by provider so the owner can verify which connection supplied them.
- Show useful capability states for connected providers, including a settings/reconnect link when grants are missing.
- Reuse artwork, provider marks, track navigation, timestamp omission, loading, empty, retry, and uncatalogued-track behavior intended for milestone 2.
- Do not mount the app-shell friend strip, friend menu, publisher polling, or viewer ticker setting.
- Add tests that spy/mock DB writes and prove the endpoint performs none, rejects unauthenticated calls, ignores target parameters, and never resolves another user’s account.

### Milestone 1.5 review initiation

- Render each reviewable self track through scilent-ui’s `InteractiveWrapper`; the authenticated layout already mounts the app-level `HarmonyInteractionProvider`.
- Keep [`apps/web/src/components/harmony-interaction-provider.tsx`](apps/web/src/components/harmony-interaction-provider.tsx) as the sole host adapter for `onWriteReview`. Its ISRC/source URL routing must use the same shared reviewability predicate as `TrackContextMenu`.
- Route into the existing [`apps/web/src/app/(authenticated)/reviews/new/page.tsx`](<apps/web/src/app/(authenticated)/reviews/new/page.tsx>) prefill contract. Let `resolveReviewSubject` produce `initialSubject` for the existing `ReviewComposer`; do not pass listening metadata into review creation.
- Preserve default review visibility/validation/submission behavior. Listening is only the discovery source for the subject.
- Add a focused Playwright flow: open a self-listening track’s actions menu, choose **Write review**, verify the correct track is prefilled, then leave without submitting and verify no review was created.

### Milestone 2 self-sync write path

Add `POST /api/v1/me/listening/sync` plus server-only helpers under `apps/web/src/lib/listening/`.

- Authenticate the publisher and check publisher eligibility before token lookup.
- Resolve only the current user’s listening-capable accounts.
- Claim per-account/capability work through `ListeningSyncState`; concurrent tabs must coalesce rather than duplicate provider calls.
- Start independent provider/capability operations together with a small concurrency cap; isolate partial failures.
- Use existing `getFreshAccessToken` and capability/scope checks in user request context. Never accept a target user ID.
- Apply provider `Retry-After`/exponential backoff to `nextAttemptAt`. Redact structured error codes; do not persist/log provider bodies.
- Select winning candidates deterministically: valid live beats none; newer trustworthy timestamps win recent; otherwise provider priority then stable provider ID. Upsert snapshots in one transaction.
- Live expiry should be a short multiple of the sync interval and must be tested with fake clocks. Do not display expired live even if cleanup has not run.
- Return `204` (or minimal sync metadata) and `Cache-Control: private, no-store`.

Mount an invisible `PublisherListeningSync` in authenticated chrome, separate from the viewer rail. It syncs on initial visible load, on focus/network recovery when eligible, and at the configured interval only while `document.visibilityState === 'visible'`. Use one shared timer/listener, AbortController on unmount, browser backoff with jitter, and no sync when publisher consent is off. Do not couple it to `showListenTicker`.

This v1 intentionally does not refresh absent publishers. Document that “Listening now” is fresh only while an opted-in publisher has an active Scilent web session; expiry prevents a stale claim. A future queue/cron may consume `ListeningSyncState` without changing the read/UI contract, but it needs a separately reviewed service-side token-refresh design.

Initial tunables should live together in `apps/web/src/lib/listening/config.ts`: 60-second visible-session now-playing cadence with up to 10% jitter, five-minute recent cadence, 150-second live expiry, four concurrent provider operations per self-sync, rail limit 12, menu limit 8 per section, page limit 25, and exponential retry from 30 seconds capped at 15 minutes. Keep them server-clamped and covered by fake-clock tests; change them from telemetry rather than scattering literals through components.

### Milestone 2 friend read API

Add `GET /api/v1/listening/friends?surface=rail|page&cursor=...&limit=...`.

- Authenticate, parse/clamp params, call only `getFriendListening`, and use the existing expected-error/Sentry handling.
- Response: `Cache-Control: private, no-store`, no cross-user CDN caching, ETag, or shared cache.
- Reject malformed cursors with the standard 400 social error. Never reveal whether a non-visible publisher has data.
- Instrument aggregate counts/freshness/error codes only; no user IDs, track titles, provider payloads, or tokens in logs/telemetry.

### Milestone 2 app shell

Update [`apps/web/src/app/(authenticated)/layout.tsx`](<apps/web/src/app/(authenticated)/layout.tsx>) and [`authenticated-shell.tsx`](<apps/web/src/app/(authenticated)/authenticated-shell.tsx>):

- Pass `showListenTicker` from `getCurrentUser()` into the persistent client shell.
- Insert `FriendListeningStrip` immediately after the sticky header and before `PullToRefreshRoot`. Do not change the feed column or onboarding placement.
- Use a null SWR key when disabled or release-gated. When enabled, revalidate on focus/online and at a conservative interval only while visible. The menu/page may share the same cache key; do not create duplicate listeners/requests.
- Omit the whole strip when loading has not produced data, the authorized result is empty, or the read fails with no cache. The existing page chrome must not jump to an error banner or toast.
- If stale cached data remains after a transient read failure, render it only while within the defined stale window; never keep a stale live label. The canonical page may show a quiet stale/retry message.

### Milestone 2 strip motion and interaction

- Keep the root `@container/listen-strip`; descendants use named arbitrary container thresholds from the prototype. Viewport breakpoints remain only for shell/sidebar/header behavior.
- Auto-loop only for `(hover: hover) and (pointer: fine)` with motion allowed **and** when measured content overflows. Start from a non-moving first render to avoid hydration motion.
- Duplicate one `aria-hidden` visual group and animate a wrapper with CSS `transform: translateX(...)` and `linear` timing. Measure width with `ResizeObserver` and derive duration from a constant pixels-per-second speed so long datasets do not race; clean up observers.
- Pause for explicit user pause, open menu, hidden tab, hover, and focus-within. Preserve user pause while the persistent shell remains mounted. Omit pause when auto-loop is unavailable.
- Coarse pointer or reduced motion uses an overflow-x snap scroller with no positional animation. Preserve native momentum and `overscroll-behavior-x: contain`.
- If content does not overflow, render a static row and omit pause.
- The visual track is `aria-hidden` and outside tab order; its split targets are pointer-only. The menu is the complete keyboard/screen-reader equivalent. Do not place focusable descendants under `aria-hidden`.
- Menu trigger is always a 44×44 minimum target on the right, uses visible faces when present, gains count/label by container width, announces a useful label, and opens an origin-aware `align="end"` popover.

### Milestone 2 menu and Friends page

- Build the menu in app code around scilent-ui rows and `@scilent-one/ui` Popover. Cap its initial rows, constrain height, preserve section order, and place “See all listening” only off `/listening`.
- Add `ROUTES.listening = { href: '/listening', label: 'Listening', protected: true, showInNav: false }` so breadcrumbs work without adding primary navigation.
- Extend the milestone 1 `apps/web/src/app/(authenticated)/listening/page.tsx` with the reviewed Friends information architecture, full authorized live/recent sections, cursor pagination, skeleton, empty state, stale/partial message, and retry. Keep **Your listening** available as the provider capability/reconnect view and keep all content inside the existing max-width rhythm.
- Person activation navigates to `/profile/{encoded username}`. Track activation navigates to `/tracks/{encoded ISRC}` when present.
- Missing ISRC opens an accessible app-owned “Not in the catalog” dialog with track/provider context. It is not a disabled target, fake route, external provider deep link, or error toast.
- No row starts playback. Provider marks remain secondary and non-interactive.

### Milestone 2 viewer settings

In [`apps/web/src/app/(authenticated)/settings/page.tsx`](<apps/web/src/app/(authenticated)/settings/page.tsx>), add a collapsible **Listening** card using `Switch` + `Label`:

- Label: “Show friends’ listening on Home”; description makes clear it controls the app-shell strip.
- Default comes from typed session data; save with optimistic rollback and disabled/pending state.
- Include a text link to `/listening`, visible whether the switch is on or off.
- Turning off immediately removes the strip/menu and cancels its friend-data request; turning on refreshes authorized data.
- Copy must not imply that this changes what the user shares. Link to publisher controls only when issue 227 ships them.

## Responsive and aesthetic contract

| Context                  | Required behavior                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `<22rem` strip container | artwork/person/title may truncate; provider mark and long label hide; right trigger remains reachable |
| `22–28rem`               | provider icon and short names appear progressively                                                    |
| `28–36rem`               | wider title/person limits and trigger count/label appear                                              |
| `>=36rem`                | optional timestamp appears; never let it displace the trigger                                         |
| coarse pointer           | no autoplay; native snap scrolling and 44px targets                                                   |
| reduced motion           | no marquee or press scaling; retain color/opacity feedback                                            |
| narrow menu              | width `min(20rem, viewport-safe inset)`; rows use compact density                                     |
| page/card containers     | rows adapt via `@container/listen-row`, not viewport `sm/md/lg` classes                               |

Use existing tokens: `font-heading`, `bg-background`, `bg-card`, `border`, `muted-foreground`, `ring`, `--ease-out`, `duration-fast`, and `duration-instant`. Interactive transitions specify exact properties. Press feedback may use `scale(.97)` only when reduced motion is not requested. Popovers use the Radix transform origin. Marquee motion is linear; no spring, stagger, blur, progress bar, glow, provider tint wash, or decorative avatar badge.

Long localized strings must truncate without covering controls. Test 200% zoom, text-only provider fallback, broken images, light/dark palettes, Windows high contrast, keyboard-only operation, screen-reader reading order, and pointer capability changes.

## Failure and degradation matrix

| Condition                           | Strip/menu                           | Canonical page                          | Sync behavior                                |
| ----------------------------------- | ------------------------------------ | --------------------------------------- | -------------------------------------------- |
| no follows / no opted-in publishers | omitted                              | friendly empty state                    | no viewer-side provider work                 |
| no live, recents exist              | “Recently played”; omit live heading | recents section only                    | normal recent cadence                        |
| provider lacks timestamp            | no time slot                         | no time slot                            | preserve source order/fingerprint            |
| missing artwork                     | muted track fallback                 | same                                    | keep item                                    |
| missing ISRC                        | uncatalogued dialog                  | same                                    | keep provider identity                       |
| unknown provider icon               | quiet text mark                      | quiet text mark                         | keep item if contract valid                  |
| expired live                        | remove immediately                   | remove immediately                      | next owner sync may restore                  |
| one provider fails                  | cached/non-failing candidates only   | quiet partial/stale state if applicable | back off only failed capability              |
| 401/insufficient scope              | no new provider data                 | do not expose token status to viewers   | owner sees reconnect state in settings       |
| DB/read outage, no cache            | omit without toast                   | inline retry/error                      | structured operational error                 |
| viewer ticker off                   | no request and no chrome             | page remains available                  | publisher sync independent                   |
| publisher revokes sharing           | remove immediately                   | remove immediately                      | stop refresh and delete/quarantine snapshots |

## Performance and scalability budgets

- No request path may perform provider calls proportional to the viewer’s follow count.
- Friend reads should remain a bounded indexed query and select only DTO fields; add query-plan/index review with realistic high-follow fixtures.
- Shell JS owns one SWR subscription, one visibility listener, one pointer media query, and one resize observer for the strip—not one per row.
- Keep presentation components statically imported; do not add an animation library for the marquee.
- Minimize the RSC-to-client boundary: pass only booleans/admin state from the authenticated layout, then fetch the friend DTO client-side.
- Images declare exact sizes; strip art is non-priority and lazy. Validate remote artwork hosts through existing Next image policy or use the existing safe fallback.
- Clamp payloads and strings. A malicious provider title or a user with many follows must not create an unbounded response/DOM.
- Track p50/p95 friend-query latency, sync duration, sync result code, snapshot age buckets, eligible publisher count, and provider 429 rate using aggregate tags only.

## Implementation sequence

Each numbered milestone can ship independently. Do not start milestone 2 by quietly adding persistence to milestone 1.

### Milestone 1 — My listening

1. **Harmony contracts and adapters**
   - Add the distinct now-playing type/base hook, fix the recent error ID, implement Spotify now/recent, add scope derivation/reconnect behavior, and update matrices/specs.
   - Preserve Apple recents/no-clock and truthful unsupported providers.
2. **Private self aggregation**
   - Add the web-owned `SelfListeningResponse`, capability-driven aggregation, and `GET /api/v1/me/listening`.
   - Run bounded independent calls; return per-provider owner statuses and partial success.
3. **Self presentation**
   - Add scilent-ui track/provider/status primitives and the authenticated **Your listening** page at `/listening`.
   - Cover long content, missing fields, unknown provider icon, reconnect, loading, empty, retry, dark mode, narrow containers, and accessibility.
4. **Milestone 1 hardening**
   - Prove there are no listening DB writes, target-user inputs, friend queries, cross-user tokens, persistent browser caches, ticker/menu, or sharing claims.
   - Add milestone 1 docs and Changesets for the packages actually changed, then ship the private self surface.

### Milestone 1.5 — Listening to review

1. **Preserve reviewable entities**
   - Return validated `HarmonizedTrack` entities from the private self endpoint and identify whether ISRC or a safe source URL can prefill a review.
2. **Compose existing interactions**
   - Wrap self-listening track content with `InteractiveWrapper`; reuse `TrackContextMenu` and the app-level `onWriteReview`.
   - Add the shared reviewability guard so the menu never offers a dead action.
3. **Verify the bridge**
   - Test ISRC and URL fallback routing, prefilled `ReviewComposer`, keyboard/touch menu access, cancellation, and no pre-submit review or listening write.
4. **Carry the contract forward**
   - Require milestone 2 snapshots/friend DTOs to retain a validated `reviewTarget` so review initiation works on eligible friend items without storing raw provider payloads.

### Milestone 2 — Friends listening / Loop

1. **Privacy seam first**
   - Confirm issue 227’s server policy and revocation hook.
   - Add the release gate and authorization tests; they must fail closed before persistence work.
2. **DB + auth foundation**
   - Add bounded snapshot/sync models, viewer ticker preference, migration, relations, generated client, cleanup behavior, and Better Auth preference inference.
3. **Consented publisher self-sync**
   - Reuse milestone 1’s aggregator, add lease/backoff/fingerprint/winner logic, and write only the authenticated opted-in publisher’s projection.
   - Test with mocked provider/token boundaries and fake time; no real provider or production DB calls.
4. **Social projection + friend API**
   - Add policy-safe following queries, pagination, DTO mapping, API validation/cache headers, and aggregate telemetry.
5. **Loop presentation**
   - Add friend variants/stories, persistent shell strip/menu, the reviewed Friends composition on `/listening`, viewer settings, and destinations.
6. **Milestone 2 hardening and release**
   - Run the full automated/manual matrix, test migration in staging, update `docs/USER_FLOWS.md`, `docs/BETA_INCOMPLETE_FEATURES.md`, and package docs, add Changesets, enable the preview flag, then stage production rollout.
   - Delete `apps/web/src/app/prototypes/friend-listen-rail/` only after production Friends surfaces have approved parity evidence.

## Verification plan

### Automated

Milestone 1:

- `pnpm --filter @scilent-one/harmony-engine test:run`
- `pnpm --filter @scilent-one/harmony-engine typecheck`
- `pnpm --filter @scilent-one/harmony-engine lint`
- `pnpm --filter @scilent-one/scilent-ui test:run`
- `pnpm --filter @scilent-one/scilent-ui typecheck`
- web unit/integration tests for self-only target derivation, capability/status mapping, partial provider failures, no-write behavior, and time formatting
- focused Playwright flow for private `/listening`, reconnect/unsupported/empty states, track destinations, and unauthorized requests

Milestone 1.5:

- scilent-ui interaction tests for reviewable and non-reviewable tracks
- web unit tests for existing `onWriteReview` ISRC/source URL routing
- focused Playwright flow from listening actions → **Write review** → correctly prefilled composer, with no POST before submit
- keyboard context-menu and touch actions-trigger coverage

Milestone 2:

- `pnpm --filter @scilent-one/social test:run`
- `pnpm --filter @scilent-one/social typecheck`
- `pnpm --filter @scilent-one/scilent-ui test:run`
- `pnpm --filter @scilent-one/scilent-ui typecheck`
- scilent-ui Storybook build/test, including a11y stories for listening states
- web unit/integration tests for sync winner selection, leases/backoff, route validation, release/privacy gates, and SWR keys
- focused Playwright flows for settings on/off persistence, shell placement, menu keyboard flow, `/listening`, split destinations, empty/no-live/missing-field states, and direct unauthorized requests
- repository `pnpm lint`, `pnpm typecheck`, and relevant `pnpm test` before final hand-off

Update [`apps/web/e2e/flows.manifest.json`](apps/web/e2e/flows.manifest.json), [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md), and `docs/BETA_INCOMPLETE_FEATURES.md`. E2E fixtures should insert policy-approved snapshots directly into the dedicated non-production test DB; they must not call Spotify/Apple.

### Manual / visual

- Compare production home/page/menu against the prototype at phone, tablet, narrow desktop, and wide desktop sizes.
- Test fine pointer, emulated coarse pointer, reduced motion, hidden/visible tab transitions, pause persistence, menu-open pause, offline/reconnect, 200% zoom, keyboard, and screen reader.
- Verify no strip flash when the saved preference is off and no layout jump when data/error is empty.
- Record a short production-route demo and screenshots for the PR; do not use the prototype as final proof.

## Release, rollback, and package versioning

- Milestone 1 normally needs Changesets for `web`, `@scilent-one/harmony-engine`, and `@scilent-one/scilent-ui`; auth consumes the expanded Harmony scope list without an auth package edit. Milestone 1.5 needs a scilent-ui Changeset only if the shared reviewability/interaction contract changes. Milestone 2 normally needs Changesets for `web`, `@scilent-one/db`, `@scilent-one/auth`, `@scilent-one/social`, and any further `@scilent-one/scilent-ui` contract change. Follow the actual diff; `apps/web` is versioned by Changesets.
- Keep DB changes additive. Rollback disables the release gate and publisher sync first; do not drop snapshot/preference columns in an emergency rollback.
- Milestone 1 rollback removes the private self page/API or disables its navigation; there is no listening data migration to reverse.
- Milestone 1 preview uses mocked provider responses and the signed-in user only. Milestone 2 preview uses synthetic opted-in users + snapshot fixtures, with provider calls mocked.
- Milestone 1 staging needs test accounts and explicitly authorized provider links but no listening-data migration. Milestone 2 staging needs the dedicated non-production DB migration plus consented publisher fixtures.
- Milestone 2 production: release gate off through deployment, migrate, enable for an explicitly consented internal cohort, watch query latency/snapshot age/429/errors, then widen.
- Immediate rollback triggers: any unauthorized cross-user row, token/provider payload in logs or responses, runaway polling, sustained provider 429s, or shell/navigation regression.
- Milestone 1 is done when private self activity works without persistence or cross-user access. Milestone 1.5 is done when a reviewable listen opens the correctly prefilled existing composer without writing anything before submit. Milestone 2 is done only when publisher-policy integration is live, not merely when the visual rail renders.

## File checklist

Milestone 1:

- `packages/harmony-engine/src/types/harmonized.types.ts`
- `packages/harmony-engine/src/types/index.ts`
- `packages/harmony-engine/src/types/provider-oauth-scopes.ts`
- `packages/harmony-engine/src/providers/base.provider.ts`
- `packages/harmony-engine/src/providers/spotify.provider.ts`
- Harmony provider/type/scope tests, README, and `agents/HARMONY_ENGINE_SPEC.md`
- `packages/scilent-ui/src/components/listening/*` self-listening primitives, barrels, tests, and stories
- `apps/web/src/lib/listening/self-types.ts` and self aggregation/tests
- `apps/web/src/lib/provider-capability-dispatch.ts`
- `apps/web/src/app/api/v1/me/listening/route.ts`
- `apps/web/src/app/(authenticated)/listening/page.tsx` and self-view components

Milestone 1.5:

- `packages/scilent-ui/src/interactions/InteractiveWrapper.tsx`
- `packages/scilent-ui/src/interactions/menus/TrackContextMenu.tsx`
- shared reviewability predicate and scilent-ui interaction tests/stories
- `apps/web/src/components/harmony-interaction-provider.tsx`
- `apps/web/src/app/(authenticated)/reviews/new/page.tsx` integration coverage
- focused listening-to-review Playwright flow and flow manifest/docs

Milestone 2:

- `packages/db/prisma/schema.prisma`, generated migration, and DB tests
- `packages/auth/src/server.ts` and inferred client/session coverage
- `packages/social/src/listening/{types,queries,index}.ts` and tests
- `packages/social/src/index.ts`
- `packages/scilent-ui/src/components/listening/*` friend variants, tests, and stories
- `apps/web/src/lib/listening/*` snapshot orchestration
- `apps/web/src/app/api/v1/me/listening/sync/route.ts`
- `apps/web/src/app/api/v1/listening/friends/route.ts`
- `apps/web/src/app/(authenticated)/layout.tsx`
- `apps/web/src/app/(authenticated)/authenticated-shell.tsx`
- `apps/web/src/app/(authenticated)/listening/page.tsx` and local components
- `apps/web/src/app/(authenticated)/settings/page.tsx`
- `apps/web/src/lib/routes.ts`
- focused web tests, Playwright specs/manifest, `docs/USER_FLOWS.md`, and `.changeset/*.md`

Treat this as a map, not permission to edit generated output by hand. Reconfirm exact symbols against the branch before implementation.
