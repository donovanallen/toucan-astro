---
name: Composer Hint Component
overview: Add a new `ComposerHint` component to `@scilent-one/ui` that shows one or more hint strings inset inside a composer's text input, cycling between multiple hints with a fade in/out transition, and wire it into `TiptapEditor` / `PostForm` / `ReviewComposer` with sensible defaults for the `@`/`#` mention hints.
todos:
  - id: component
    content: Create ComposerHint component in packages/ui/src/components/social/composer-hint.tsx with cycling fade animation + reduced-motion support
    status: pending
  - id: export
    content: Export ComposerHint/ComposerHintProps from packages/ui/src/index.ts
    status: pending
  - id: story
    content: Add Storybook stories for ComposerHint
    status: pending
  - id: tiptap-wire
    content: Add composerHints prop to TiptapEditor, render inset ComposerHint when editor is empty, suppress static placeholder when composerHints is set
    status: pending
  - id: postform-wire
    content: Forward composerHints prop through PostForm
    status: pending
  - id: reviewcomposer-wire
    content: Add composerHints prop + sensible mention-hint defaults to ReviewComposer
    status: pending
  - id: tests
    content: Add unit tests for ComposerHint cycling/visibility behavior
    status: pending
  - id: changeset
    content: Add changeset for packages/ui and packages/scilent-ui changes
    status: pending
isProject: false
---

## Background

- The rich text composer is [`TiptapEditor`](packages/ui/src/components/tiptap-editor.tsx), used by [`PostForm`](packages/ui/src/components/social/post-form.tsx), used by [`ReviewComposer`](packages/scilent-ui/src/components/review/ReviewComposer.tsx). `@` (user) and `#` (artist) mentions are already fully implemented via Tiptap `Mention` extensions.
- Today the editor only supports a single static placeholder string, rendered via Tiptap's `Placeholder` extension as CSS `content: attr(data-placeholder)` (`packages/ui/src/globals.css:785-788`). That mechanism can't cycle between multiple strings, so a real React component is needed for cycling text.
- No animation library exists in the repo (no Framer Motion). Existing convention for JS-coordinated fades is plain CSS `transition-opacity` classes (see [`Reveal`](packages/ui/src/components/reveal.tsx)) combined with the [`useReducedMotion`](packages/ui/src/hooks/use-reduced-motion.ts) hook and the `duration-fast`/`duration-base`/`ease-out`/`ease-in` theme utilities from `globals.css`. We'll follow that same pattern rather than introducing `tw-animate-css` keyframe animations, since those are one-shot and awkward to replay without remounting.
- The "absolutely-positioned overlay inset in an input" technique already exists in [`artists-input-bar.tsx`](<apps/web/src/app/(authenticated)/artists/_components/artists-input-bar.tsx>) (icon positioned via `absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`) — reuse that technique.

## New component: `ComposerHint`

Location: `packages/ui/src/components/social/composer-hint.tsx` (co-located with `post-form.tsx` / `message-composer.tsx`), exported from `packages/ui/src/index.ts`.

```tsx
export interface ComposerHintProps {
  /** One or more hint strings; cycles between them when more than one is given. */
  hints: string | string[];
  /** Whether the hint is shown at all (e.g. parent passes `editor.isEmpty`). */
  visible?: boolean;
  /** Ms each hint is shown before cycling to the next. Default 3000. */
  intervalMs?: number;
  className?: string;
}

export function ComposerHint({ hints, visible = true, intervalMs = 3000, className }: ComposerHintProps) { ... }
```

Behavior:

- Normalize `hints` to an array; if length <= 1, render the single string statically (no interval/cycling needed), still fading in on mount/`visible` change.
- If length > 1, run a `setInterval` that flips a `fading` boolean to `true`; after a short timeout (matching `duration-fast`, 150ms) it advances `index` (`(i + 1) % hints.length`) and flips `fading` back to `false`. Clear both timers on unmount/hints change.
- Use `useReducedMotion()`: when reduced motion is preferred, skip the opacity transition entirely (swap text instantly, keep the interval/cycling itself since that's content rotation, not "animation" in the accessibility sense) — mirrors how `Reveal` special-cases reduced motion.
- Render markup:

```tsx
<span
	aria-live="polite"
	className={cn(
		'pointer-events-none select-none truncate text-sm italic text-muted-foreground transition-opacity',
		prefersReducedMotion ? 'duration-instant' : 'duration-fast',
		fading ? 'opacity-0 ease-in' : 'opacity-100 ease-out',
		className,
	)}
>
	{hintsArray[index]}
</span>
```

- Default className is just the text styling (matches the existing Tiptap placeholder look: `text-muted-foreground italic`, see `globals.css:786`); positioning (`absolute left-3 top-1/2 -translate-y-1/2 ...`) is left to the consumer via `className`, so the component stays reusable for any host (Tiptap editor, plain `Textarea`, etc.) rather than baking in one layout.
- `aria-live="polite"` (or `role="status"`) so screen readers announce hint changes without being disruptive; wrap in a `sr-only`-friendly way if needed — keep it simple and test with existing a11y conventions in the package.

Add a Storybook story `packages/ui/src/components/stories/social/composer-hint.stories.tsx` (pattern per `message-composer.stories.tsx`) with stories: `SingleHint`, `CyclingHints`, `Hidden` (`visible=false`).

## Wiring into the composer stack

1. [`TiptapEditor`](packages/ui/src/components/tiptap-editor.tsx):
   - Add optional prop `composerHints?: string[]`.
   - Ensure the container div (around line 742) is `relative` so an absolutely-positioned hint can be inset over the `EditorContent`.
   - When `composerHints` is provided, render `<ComposerHint hints={composerHints} visible={editor?.isEmpty ?? false} className="absolute left-3 top-1/2 -translate-y-1/2 max-w-[calc(100%-1.5rem)]" />` right after `<EditorContent editor={editor} />` (or before, since it's absolutely positioned and `pointer-events-none`).
   - When `composerHints` is passed, pass `placeholder=''` to the `Placeholder` extension config (or otherwise suppress it) so the static Tiptap placeholder and the new cycling hint don't render on top of each other.

2. [`PostForm`](packages/ui/src/components/social/post-form.tsx): add `composerHints?: string[]` to `PostFormProps`, forward to `<TiptapEditor composerHints={composerHints} ... />`.

3. [`ReviewComposer`](packages/scilent-ui/src/components/review/ReviewComposer.tsx): add optional `composerHints?: string[]` prop (forwarded to `PostForm`), and default it to `["Type @ to mention a user", "Type # to mention an Artist"]` when the composer supports mentions (i.e. when `onMentionQuery`/`onArtistMentionQuery` are supplied), so existing review/post creation screens get the hint for free without every call site having to pass it explicitly.

## Testing / verification

- New Vitest unit test for `ComposerHint` (e.g. `packages/ui/src/components/social/__tests__/composer-hint.test.tsx` if such a convention exists, else co-located `*.test.tsx`) covering: renders single hint statically, cycles through multiple hints on a fake timer, respects `visible={false}` (renders nothing or hides), and doesn't crash with `hints={[]}`.
- Manually verify in Storybook and in the review-composer / post-composer UI that the hint appears while the editor is empty, disappears once typing starts, and multiple hints fade between each other smoothly.
- Run `pnpm --filter @scilent-one/ui test`, `pnpm --filter @scilent-one/ui lint`, and `pnpm --filter @scilent-one/scilent-ui test` for the touched packages.

## Changeset

Since this touches `packages/ui` and `packages/scilent-ui`, add a changeset via `pnpm changeset` (minor bump for the new component/prop) describing the new `ComposerHint` component and the `composerHints` prop additions, per `AGENTS.md`/`docs/RELEASE.md`.
