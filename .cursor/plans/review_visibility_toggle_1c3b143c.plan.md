---
name: Review visibility toggle
overview: Add a `visibility` (PUBLIC/PRIVATE) field to reviews, enforce it across every read path, and expose it in the UI as an animated eye-icon toggle in the review composer plus a lock indicator and subtle styling on private review cards.
todos:
  - id: schema-migration
    content: Add PostVisibility enum + Post.visibility field, run pnpm db:migrate
    status: pending
  - id: social-types-mutations
    content: Update types.ts, createReview/updateReview, add setReviewVisibility
    status: pending
  - id: social-filtering
    content: Add visibility filtering to getReviews, getPostById, getPostsByAuthor, getLikedPosts, getUserReposts, home/explore/profile feeds
    status: pending
  - id: api-routes
    content: Add PATCH /api/v1/reviews/[id]/visibility route, pass visibility through create/update routes
    status: pending
  - id: composer-toggle
    content: Add animated Eye/EyeOff toggle to ReviewComposer and wire through new-review-page-client
    status: pending
  - id: card-indicator
    content: Add private badge + subtle styling to ReviewCard
    status: pending
  - id: postcard-toggle
    content: Add owner dropdown toggle in PostCard, wire optimistic update in post-detail-page-client and review list pages
    status: pending
  - id: changeset
    content: Run pnpm changeset for packages/db and packages/social changes
    status: pending
isProject: false
---

# Review visibility toggle

## Data model

Reviews are `Post` rows with `type: 'REVIEW'` (see [packages/db/prisma/schema.prisma](packages/db/prisma/schema.prisma) lines 122-181) — there is no separate `Review` model, so visibility is a `Post` column.

- Add enum + field to `Post` in `packages/db/prisma/schema.prisma`:

```prisma
enum PostVisibility {
  PUBLIC
  PRIVATE
}

model Post {
  ...
  visibility  PostVisibility @default(PUBLIC)
  ...
  @@index([visibility])
}
```

- Run `pnpm db:migrate` (from repo root) to generate `packages/db/prisma/migrations/<timestamp>_add_post_visibility/`, following the existing naming convention (e.g. `20260708170000_add_reviews`). Commit the generated SQL.
- Since `Post.visibility` defaults to `PUBLIC`, existing reviews/posts are unaffected.

## Backend: types & mutations (`packages/social`)

- [packages/social/src/types.ts](packages/social/src/types.ts): add `visibility?: 'PUBLIC' | 'PRIVATE'` to `CreateReviewInput` (line 103) and `UpdateReviewInput` (line 109). Re-export `PostVisibility` from `@scilent-one/db` (near line 222).
- [packages/social/src/reviews/mutations.ts](packages/social/src/reviews/mutations.ts):
  - `createReview` (line 105): pass `visibility: input.visibility ?? 'PUBLIC'` into `db.post.create` data (line 137-146). Skip the `REVIEW_CREATED` activity fan-out to followers (line 162-176) when `visibility === 'PRIVATE'`, since a private review shouldn't notify followers.
  - `updateReview` (line 185): accept `visibility` in the update `data` (line 233-237) so the existing edit flow can also change it if needed.
  - Add a small dedicated `setReviewVisibility(userId, postId, visibility)` function (ownership check identical to `updateReview` lines 190-205, but only touches the `visibility` column) — this backs a fast, optimistic toggle endpoint instead of requiring a full review edit.

## Backend: authorization filtering (critical — every review read path)

Add a shared helper in `packages/social/src/posts/includes.ts` (or a new `visibility.ts`):

```ts
export function visibilityWhere(viewerId?: string) {
	return {
		OR: [
			{ visibility: 'PUBLIC' as const },
			...(viewerId ? [{ authorId: viewerId }] : []),
		],
	};
}
```

Apply it (AND-ed with existing filters) in:

- `getReviews` — [packages/social/src/reviews/queries.ts](packages/social/src/reviews/queries.ts) line 59-66 `where` block.
- `getPostById` — `packages/social/src/posts/queries.ts` line 20-24: after fetching, if `post.visibility === 'PRIVATE' && post.authorId !== currentUserId`, throw `NotFoundError` (don't leak existence via a 403).
- `getPostsByAuthor` — same file, line 58-67 `where` block (used for profile "posts" tab).
- `getLikedPosts` / `getUserReposts` — same file, filter the joined `Post` similarly.
- `packages/social/src/feeds/home-feed.ts` (`getHomeFeed`), `packages/social/src/feeds/explore-feed.ts` (`getExploreFeed`, `getTrendingPosts`), `packages/social/src/feeds/profile-feed.ts` (`getProfileFeed`) — add the same `OR` filter to each `db.post.findMany` where clause.

This ensures a private review is only ever returned to its author, everywhere.

## Backend: API routes (`apps/web/src/app/api/v1`)

- [apps/web/src/app/api/v1/reviews/route.ts](apps/web/src/app/api/v1/reviews/route.ts): `POST` handler (line 46-87) passes `body.visibility` through to `createReview`.
- [apps/web/src/app/api/v1/reviews/[id]/route.ts](apps/web/src/app/api/v1/reviews/[id]/route.ts): `PATCH` handler passes `body.visibility` through to `updateReview` (optional, for the full-edit path).
- New route `apps/web/src/app/api/v1/reviews/[id]/visibility/route.ts` with a `PATCH` handler calling `setReviewVisibility(user.id, id, body.visibility)` — small, fast, dedicated endpoint for the toggle (mirrors the like/unlike style of focused mutation endpoints already in this codebase).

## Frontend: composer toggle (core ask)

[packages/scilent-ui/src/components/review/ReviewComposer.tsx](packages/scilent-ui/src/components/review/ReviewComposer.tsx):

- Add local state `const [visibility, setVisibility] = React.useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')`.
- Render an icon toggle button next to (or below) the "Attach album or track" button (line 90-99), using `Eye`/`EyeOff` from `lucide-react` (not used elsewhere yet, confirmed available since `lucide-react` is already a dependency).
- Animate the icon swap with Tailwind transition utilities already used in this codebase (e.g. `transition-transform active:scale-95` from `PostCard`'s like button, `animate-in fade-in-0 duration-200` from its edit-mode reveal) — no new animation dependency needed (no `framer-motion` in the repo). A simple crossfade/scale-in on icon swap plus a label text swap ("Public" / "Only you") gives the "animated eye" feel without new deps.
- Pass `visibility` through in `onSubmit(content, contentHtml, subject, visibility)` (extend the `onSubmit` prop signature).
- [apps/web/src/app/(authenticated)/reviews/new/\_components/new-review-page-client.tsx](<apps/web/src/app/(authenticated)/reviews/new/_components/new-review-page-client.tsx>): thread `visibility` into the `fetch('/api/v1/reviews', ...)` body (line ~27-93).

## Frontend: private indicator + subtle card styling

[packages/scilent-ui/src/components/review/ReviewCard.tsx](packages/scilent-ui/src/components/review/ReviewCard.tsx):

- Extend `ReviewCardProps`/`ReviewSubjectDisplay` usage to accept `visibility` (it'll already flow through `postCardProps` since `Post.visibility` is on the underlying row / `PostWithAuthor`).
- Next to the existing `Badge variant="secondary"` "Album review"/"Track review" pill (lines ~35-39), conditionally render a second `Badge` with a `Lock`/`EyeOff` icon and "Private" label when `visibility === 'PRIVATE'`.
- On the outer wrapper `div` (currently `rounded-lg border bg-card overflow-hidden`, line ~63), add a subtle conditional class for private reviews, e.g. `visibility === 'PRIVATE' && 'border-dashed bg-muted/30'` — distinct but not loud.
- Because the review detail page ([apps/web/src/components/post-detail-page-client.tsx](apps/web/src/components/post-detail-page-client.tsx) line 548-556) and every review list (`entity-reviews-page-client.tsx`, `feed/page.tsx`) all render through this same `ReviewCard`, this single change covers "review card" and "details page" simultaneously.

## Frontend: toggling visibility after publish (owner management)

[packages/ui/src/components/social/post-card.tsx](packages/ui/src/components/social/post-card.tsx):

- Add `visibility` and `onToggleVisibility?: () => void` to `PostCardProps` (near line 58).
- In the existing owner-only `DropdownMenu` (lines 371-401, currently Edit/Delete), add a menu item above Delete: an animated `Eye`/`EyeOff` icon + "Make private" / "Make public" label, calling `onToggleVisibility`.
- Wire it in [apps/web/src/components/post-detail-page-client.tsx](apps/web/src/components/post-detail-page-client.tsx) (`cardProps`, line 516-539) and in the review list pages that render `ReviewCard`/`PostCard` for the current user's own reviews, following the same optimistic-update + SWR-rollback pattern already used for `handleSaveEdit` (lines 275-306): call the new `PATCH /api/v1/reviews/[id]/visibility` route, optimistically flip local state, revert + toast on failure.

## Changeset

Per [AGENTS.md](AGENTS.md), `packages/db` and `packages/social` are external-consumer packages — run `pnpm changeset` describing "Add review visibility (public/private) support" before considering the work done.

## Todos summary

- Prisma schema + migration for `PostVisibility`
- Social package: types, `createReview`/`updateReview`/`setReviewVisibility`, visibility filtering across all read paths
- New `PATCH /api/v1/reviews/[id]/visibility` route + `visibility` passthrough on existing routes
- `ReviewComposer` animated eye toggle + wiring in new-review page
- `ReviewCard` private badge + subtle card styling
- `PostCard` owner dropdown "Make private/public" toggle + wiring with optimistic update
- Changeset
