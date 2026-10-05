---
name: Sharing ladder (v0 → v3)
overview: Treat sharing as a ladder instead of building the ambitious cross-provider resolver first. v0 (share into Scilent via PWA share_target + provider URL normalization), v1 (canonical public share-out links + OG previews + Share button), and v1.5 (a web-only 1080x1920 story-formatted PNG export for Instagram/Snapchat/etc. Stories) are implemented. v2 (share via DM rich cards) and v3 (cross-platform "open in my app") are scoped below but intentionally not started — don't block beta on them.
todos:
  - id: v0-url-normalize
    content: Tighten Spotify/Tidal/Apple share URL normalization + redirect follow for short hosts; add real share-URL fixtures in harmony-engine
    status: completed
  - id: v0-pwa-share-target
    content: Add PWA manifest share_target -> /reviews/new; accept text/url share params; document in REVIEW_INGRESS
    status: completed
  - id: v1-artist-lookup
    content: 'Add HarmonizationEngine.lookupArtistByMbid() (musicbrainz-only) so the artist entity page has a data source'
    status: completed
  - id: v1-canonical-pages
    content: Ship public /tracks/{isrc}, /releases/{gtin}, /artists/{mbid} entity pages under a new (public) route group; allowlist prefixes in isPublicPath; generateMetadata OG/Twitter cards
    status: completed
  - id: v1-share-ux
    content: Centralize canonical URL helpers (canonical-urls.ts); add ShareButton (navigator.share + clipboard fallback); wire into entity pages, harmony-interaction-provider Copy Link, and review/post detail header
    status: completed
  - id: v1-docs
    content: Write docs/SHARING.md (mirrors docs/MOBILE.md structure), update docs/DOGFOOD_REVIEWS.md deferred list + add A2 checklist section
    status: completed
  - id: v1-review-post-public
    content: Make public /review/{id} readable while logged out; add per-page generateMetadata OG/Twitter tags; return 404 for private content to unauthorized viewers and crawlers
    status: completed
  - id: v1-post-public
    content: Decide whether /post/{id} should be readable while logged out and implement its metadata/privacy policy
    status: pending
  - id: v1.5-story-image-export
    content: 'Add a web-only 1080x1920 story-formatted PNG export (Save story image) on the three public entity pages, reusing the OG artwork/branding pipeline; no Instagram APIs, native sharing, QR codes, or link-sharing changes'
    status: completed
  - id: v2-dm-attachments
    content: MessageAttachment model + API; composer pick entity/review; rich card in thread reusing entity UI
    status: pending
  - id: v3-open-in-provider
    content: Auth-optional open-in-provider CTAs from sources + "which provider won" analytics; do not block beta
    status: pending
isProject: false
---

# Sharing ladder (v0 → v3)

Full context and up-to-date implementation details live in [`docs/SHARING.md`](../../docs/SHARING.md)
— this plan file tracks scope and status; that doc is the maintained reference for how it actually
works. Don't duplicate edits here without updating that doc too.

## Why a ladder

The ambitious version of "sharing" is a cross-provider resolver: paste any link, get "open in your
provider" back, no matter what service the recipient uses. That's v3. Building it first means
solving multi-provider identity resolution, deep-link maps, and auth-optional landing pages before
shipping anything a user can feel. Instead:

- **v0 — share into Scilent** (almost free — mostly wiring existing pieces)
- **v1 — share out a Scilent link** (do this next after v0; this pass)
- **v1.5 — story image export** (web-only 1080x1920 PNG download; reuses v1's pipeline, no native IG)
- **v2 — share via messages** (needs new data model — DM attachments)
- **v3 — cross-platform "open in my app"** (ambitious, prerequisites from v1, not a beta blocker)

## v0 — Share into Scilent (done, merged)

Ingress via `/reviews/new?url=<providerUrl>` plus login-redirect survival, PWA `share_target` →
that route, and tightened Spotify/Tidal/Apple share-URL normalization (short-link expansion,
allowlisted hosts) in `harmony-engine`. Fully documented in `docs/REVIEW_INGRESS.md`.

## v1 — Share out a Scilent link (done, this pass)

**Canonical public URLs.** `/tracks/{isrc}`, `/releases/{gtin}`, `/artists/{mbid}` — id-based, no
slugs, matching the identifiers the harmony engine already resolves by. Centralized in
`apps/web/src/lib/canonical-urls.ts`.

**Public read.** These three pages live in a new `apps/web/src/app/(public)/` route group (its own
layout, no auth redirect) rather than `(authenticated)/`, and their prefixes were added to
`isPublicPath()` in `apps/web/src/lib/auth-guards.ts` so middleware doesn't redirect them either.
`/review/{id}` now follows the same public-routing model, with review-specific OG/Twitter metadata
and `notFound()` for private content when the viewer is not its author. `/post/{id}` deliberately
remains authenticated pending a product decision; see `v1-post-public` above and the "Known rough
edges" section of `docs/SHARING.md`.

**New engine capability.** Artist entity pages needed a lookup-by-id path the harmony engine didn't
have (`lookupByGtin`/`lookupByIsrc` existed; nothing for artists). Added
`LookupCoordinator.lookupArtist(mbid)` and `HarmonizationEngine.lookupArtistByMbid(mbid)`, targeting
`musicbrainz` only since artist identity has no cross-provider merge yet. Changeset:
`.changeset/artist-lookup-by-mbid.md`. New public route: `GET /api/v1/artists/[mbid]`.

**OG metadata.** Each page's `generateMetadata()` resolves the entity server-side and returns
`openGraph`/`twitter` tags plus `alternates.canonical`, so pasting a link into iMessage/Slack shows
a real preview instead of a blank/generic card.

**Share UX.** New `apps/web/src/components/share-button.tsx` — Web Share API where available,
clipboard fallback otherwise. Wired onto the three entity pages and onto `/review/{id}` /
`/post/{id}` (only when not private). `harmony-interaction-provider.tsx`'s **Copy Link** action (and
**Write review** / **See reviews** / **View credits**) now build paths through the same
`canonical-urls.ts` helpers instead of ad hoc template strings.

**Docs.** `docs/SHARING.md` (this ladder + file map + human-only steps + testing + known rough
edges), `docs/DOGFOOD_REVIEWS.md` section A2.

Entity pages themselves are intentionally minimal — existing componentry only (`TrackCard`,
`AlbumCard`, `ArtistHeader`), no new tabs/sections, per explicit scope direction for this pass.

## v1.5 — Story image export (done)

An interim, web-only step toward "share to Instagram Stories" that deliberately avoids Instagram's
native sharing APIs. OG images are **crawler previews of a link**; a story asset is **the payload
itself** — a 1080x1920 PNG the user downloads and posts. Instagram does not unfurl links in Stories,
so there is no metadata tag that makes a Scilent link look good there; the only thing that carries
is the image. This rung ships that image and a one-click way to save it. Native "Sharing to Stories"
(iOS pasteboard sticker keys / Android `ADD_TO_STORY` intent, a Facebook App ID, dominant-color
gradient, and a link sticker) is explicitly **out of scope** here and is gated on mobile Phase 1.

**Scope and UX.**

- A separate **Save story image** action beside the existing **Share** on the three public entity
  pages. The two stay distinct: Share hands off a canonical URL; Save downloads pixels.
- One click: inline pending/disabled state while the PNG generates, download under a sanitized
  entity-specific filename, then success/error feedback. No preview modal, no native IG hooks.
  Mobile browsers control whether the file lands in Downloads/Files or opens for manual saving to
  Photos — document that, don't fight it.
- A purpose-built 1080x1920 layout (not the 1200x630 OG card rotated): Instagram-safe top/bottom
  breathing room (~250px each, occluded by IG's own chrome), centered square artwork, entity
  type/title/subtitle, Scilent branding. Branded artwork-free fallback when the harmony engine has
  no artwork, mirroring the OG card's behavior.

**Image pipeline.**

- Pure story-card constants + URL/filename builders in a focused helper
  (`apps/web/src/lib/story-card.ts`): 1080x1920 PNG dims, deterministic `/api/story` query
  construction, cache policy, safe download filename. Kept free of `next/og` so it's unit-testable
  without Satori, exactly like `og-card.ts`.
- A sibling `renderStoryCard()` + response factory in `apps/web/src/lib/og.tsx`, reusing the
  existing allowlisted `loadRemoteArtwork()` and local brand PNG loader. The current 1200x630 OG
  renderer is left unchanged.
- A public Node.js image route at `apps/web/src/app/api/story/route.tsx` mirroring `api/og/route.tsx`
  — bounded title/subtitle/eyebrow/artwork params, cached PNG response with a
  `Content-Disposition: attachment` filename, guarded by the existing HTTPS artwork-host allowlist.

**Page integration.** A small client component (`apps/web/src/components/story-image-button.tsx`)
that fetches the image only on user intent, downloads it via a temporary object URL (revoked after),
and handles pending/success/failure accessibly. Wired into the three `(public)` entity pages,
passing only the title, subtitle, entity label, and artwork URL each server page already resolves.

**Font note.** The OG cards render with `fontFamily: 'sans-serif'` and load no font files — fine at
chat-unfurl scale, but a 1080x1920 asset someone posts to followers should load real brand font
bytes into `ImageResponse`'s `fonts` option. Treat that as part of this rung's polish.

**Tests.** Unit coverage for story URL encoding, omitted optional fields, dimensions, cache
contract, and filename sanitization (alongside or mirroring `og-card.test.ts`). Endpoint check that
the response is a 1080x1920 PNG with cache + content-disposition headers, including the artwork-free
case. Manual pass of all three buttons at desktop and mobile widths (pending/success/failure).

**Why it's v1.5, not part of v2/v3.** It's orthogonal to DM rich cards (v2) and cross-provider
deep links (v3). It reuses v1's public entity pages and artwork pipeline and needs no new data
model. The one place it touches v3's territory is the eventual "how does a viewer get back to
Scilent from a screenshot" question (a QR code or short link on the card) — deferred here; the v1.5
asset is shareable on its own without it.

## v2 — Share via messages (not started)

**Shipped separately (not v2):** DM URL OG link-preview cards — the first `http`/`https` URL in a
message unfurls via authenticated `GET /api/v1/link-preview` and renders `LinkPreviewCard` below the
bubble. See [How link previews in DMs work](../../docs/SHARING.md#how-link-previews-in-dms-work) in
`docs/SHARING.md`. No `MessageAttachment` model; external URLs only.

Attach a harmonized entity (or review) into a DM as a rich card, reusing entity UI and the
interaction provider:

- Extend `Message`/add a `MessageAttachment` model in `packages/db/prisma/schema.prisma` (subject
  type + snapshot, same shape as `ReviewSubject.snapshot`).
- Extend `sendMessage` in `packages/social/src/messages/mutations.ts`.
- Extend `MessageComposer` (`packages/scilent-ui/src/components/social/message-composer.tsx`, today
  text-only) to pick an entity/review before sending.
- Render the rich card in `apps/web/src/app/(authenticated)/messages/[id]/page.tsx` by reusing
  `hydrateHarmonizedEntityFromSnapshot()` + the same cards the review-subject preview uses.

## v3 — Cross-platform "open in my app" (not started, not a beta blocker)

A Scilent share URL → landing page offering "Open in Spotify / Apple Music / Tidal / …", resolving
the entity once via the GTIN/ISRC/MBID + provider ids the harmony engine already stores
(`externalIds`, `sources` on every harmonized entity). Needs: stable entity identity on the share
page (have it, from v1), a provider deep-link map (don't have it), an auth-optional landing page
(precedent now exists via the `(public)` route group from v1), and analytics for "which provider
won" (don't have it). Prerequisites from v1 (canonical links + reliable multi-provider ids) are
satisfied; this is scoped but explicitly deferred past beta.
