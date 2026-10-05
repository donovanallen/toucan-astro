---
name: polish
description: Final quality pass for scilent-x web UI — alignment, spacing, consistency, interaction states, accessibility, and design-system drift before shipping. Adapted from pbakaus/impeccable polish. Use when the user invokes /polish, asks for a pre-ship polish pass, or wants micro-interaction and state completeness after a feature is functionally done.
disable-model-invocation: true
user-invocable: true
---

# Polish (scilent-x)

Final refinement pass. Polish is refinement, never concealed redesign. Preserve
the incumbent visual world, content, behavior, and everything outside scope.

Upstream:
[pbakaus/impeccable `reference/polish.md`](https://github.com/pbakaus/impeccable/blob/main/.agent/skills/impeccable/reference/polish.md)
(Impeccable v4 command `polish`).

## Repo adaptations (read first)

Upstream polish expects `PRODUCT.md`, `DESIGN.md`, `/impeccable` context, and
critique-storage binaries. **This repo does not ship those.** Substitute:

| Upstream                              | scilent-x stand-in                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `DESIGN.md`                           | `packages/ui/src/globals.css` + component APIs in `packages/ui` / `packages/scilent-ui`             |
| `PRODUCT.md`                          | `docs/USER_FLOWS.md`, `AGENTS.md`, feature docs under `docs/`                                       |
| `impeccable context` / detector hooks | Manual checklist below + existing skills (`minimalist-ui`, `emil-design-eng`, `responsive-testing`) |
| critique-storage CLI                  | Optional prior audit notes (e.g. `docs/research/*-audit.md`); never block on missing snapshots      |

Do **not** install the Impeccable binary or add PRODUCT.md/DESIGN.md as a side
effect of `/polish` unless the user explicitly asks.

Default quality bar for product UI: **flagship Operate mode** (scanability,
token consistency, real states). Marketing landing may be Persuade — keep
intentional atmosphere; do not flatten it into admin chrome.

## Workflow

```
Polish progress:
- [ ] 1. Establish the system (tokens + neighboring flows)
- [ ] 2. Gather evidence (path complete? states? viewports?)
- [ ] 3. Triage (functional → states → system drift → visual → cleanup)
- [ ] 4. Polish the whole path
- [ ] 5. Verify (mouse/keyboard/touch; loading/empty/error)
- [ ] 6. Ship narrow diffs; document intentional exceptions
```

## Triage order

1. Broken/blocked tasks, misleading state, inaccessible paths
2. Missing loading / empty / error / success / disabled states
3. Flow, hierarchy, responsive, and design-system drift
4. Visual and motion inconsistencies
5. Code and asset cleanup

## Polish checklist (Operate surfaces)

### Interaction and state

- Every control: default, hover, `focus-ring`, active, disabled, loading where async
- Visible keyboard focus; logical tab order; labels; `touch-target` on coarse pointers
- Motion: prefer `duration-fast|base|slow` + `--ease-*`; do not add spectacle

### Layout, type, color

- Align to existing spacing; optical as well as mathematical alignment
- Same-role typography consistent; prefer theme text sizes over `text-[9px]` sprawl
- Semantic tokens only; verify contrast (avoid stacking opacity on already-muted text)

### Content and code

- Terminology consistent; ask before changing factual claims
- Replace one-offs with shared components; promote reusable values to tokens
- Remove dead styles, unused imports, polish-created duplication

## Safe with `/minimalist-ui`

Complementary when both run: minimalist-ui finds aesthetic/system drift;
polish verifies the **path is finished** (states, focus, responsive, cleanup).
If they conflict, **preserve the scilent-x incumbent** and see
[divergences.md](divergences.md).

## Related

- Full upstream protocol: [reference.md](reference.md)
- Conflict notes vs minimalist-ui / craft-floor: [divergences.md](divergences.md)
- Examples: [examples.md](examples.md)
- Sibling: `.cursor/skills/minimalist-ui/`, `emil-design-eng`, `responsive-testing`
