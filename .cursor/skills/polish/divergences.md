# Divergences: polish vs minimalist-ui (and craft-floor)

Callouts from applying both skills on scilent-x. Prefer the **incumbent
scilent-x system** when upstream skills disagree.

## Major conflicts

| Topic              | minimalist-ui (upstream)                    | polish / craft-floor (upstream)                                   | scilent-x decision                                                                |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Role               | Push an editorial aesthetic                 | Preserve incumbent; refinement only                               | Polish wins for product UI; minimalist adapted as audit against tokens            |
| Icons              | Ban Lucide; prefer Phosphor/Radix           | Keep one coherent icon family                                     | **Keep Lucide**; `ProviderIcon` for DSP marks                                     |
| Fonts              | Serif headings + Geist/SF stacks            | Honor committed type                                              | **Keep** Doto / Space Grotesk / Source Sans 3 / Space Mono                        |
| Shadows            | Practically none / opacity &lt; 0.05        | Offset + soft blur; zero-offset halo is decoration                | Use existing `--shadow-*` tokens (already soft)                                   |
| Motion properties  | Animate **only** transform/opacity          | craft-floor allows blur, backdrop-filter, clip-path, mask, shadow | Prefer transform/opacity; allow existing blur sparingly on chrome already in repo |
| Scroll entrances   | Fade/slide every major block                | Do not add animation merely to show polish; one authored moment   | **Do not** mass-add scroll reveals on product UI                                  |
| Gradients          | Ban gradients, then suggest ambient radials | Ban decorative glass/blur and gradient text                       | Flat product/admin chrome; landing may keep intentional washes                    |
| Pills              | Badges may be `rounded-full`                | No strong ban                                                     | Badges/avatars OK; not primary buttons                                            |
| Section numbers    | Bento/editorial OK                          | craft-floor refuses `01 / 02 / 03` kickers                        | Landing `FEATURES` indexes are intentional marketing; do not strip without ask    |
| Kickers / eyebrows | Not emphasized                              | craft-floor **hard ban** on eyebrow above heading                 | Do not mass-delete existing labels; avoid adding new ones                         |
| Docs prerequisites | None                                        | Requires PRODUCT.md / DESIGN.md / impeccable CLI                  | **Adapted:** globals.css + USER_FLOWS; no binary install                          |

## Internal inconsistencies (upstream)

1. **minimalist-ui vs itself:** absolute ban on gradients, then §6/§8 ask for
   ambient radial gradients and soft light spots. Treat product UI as flat;
   reserve ambient depth for marketing if brand asks.
2. **minimalist-ui icon ban vs scilent-x:** Lucide is the shared UI icon set
   across `packages/ui`. Replacing it is a major dependency migration, not a
   polish task.
3. **polish “flagship” vs time box:** polish wants whole-path completeness;
   cloud agents should triage to CRITICAL/HIGH and defer cosmetic sprawl with
   an explicit backlog rather than endless micro-edits.
4. **craft-floor “display max 6rem / measure 65–75ch”:** useful on Read/Persuade
   surfaces; Operate app shells often use denser type — do not force article
   measure on feed/catalog grids.

## Unclear / needs product judgment

- **Card hover lift** (`hover:-translate-y-0.5 hover:shadow-md` on catalog
  cards): mild elevation matches polish interaction feedback; strict
  minimalism would flatten. Left as-is for consistency.
- **Apple Music dual reds:** icon brand `#FA233B` (official mark) vs wash token
  `--platform-apple-music` `#d6203a` (deepened for AA). Intentional split —
  document rather than force one hex everywhere.
- **Navbar / shell `backdrop-blur`:** polish/minimalist both dislike decorative
  glass; product shell uses blur for overlapping content readability. Defer
  removal unless redesigning the shell.
- **Landing feature indexes (`01`…) and section labels:** craft-floor would
  delete; product marketing currently relies on them. Ask before changing.

## How agents should compose the two

1. Run `/minimalist-ui` for consistency/balance/usability **audit** against
   tokens (focus, shadows, clichés, admin chrome).
2. Run `/polish` to finish the **path** (states, touch, contrast, cleanup).
3. On conflict: incumbent scilent-x tokens + polish “preserve” beat upstream
   aesthetic prescriptions from either skill.
