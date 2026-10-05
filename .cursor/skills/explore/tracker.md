# Local Markdown Tracker

Use this fallback only when the repository's issue tracker cannot be written through available
tools. Keep the files on the working branch so collaborators and later sessions share the same
state.

## Layout

```text
docs/explorations/<map-slug>/
├── map.md
└── tickets/
    ├── <ticket-slug>.md
    └── ...
```

The map uses the template from `SKILL.md` and adds an **Open tickets** index:

```markdown
## Open tickets

- [<ticket title>](tickets/<ticket-slug>.md) — `<type>` — status: unclaimed
```

Each ticket uses:

```markdown
# <Ticket title>

- Type: research | prototype | grilling | task
- Status: open | closed
- Claim: unclaimed | <agent/run identifier>
- Blocked by: <relative ticket links or "none">

## Question

<The decision or investigation this ticket resolves.>

## Resolution

<!-- Fill only when closing the ticket. Link assets rather than pasting them. -->
```

## Operations

- **Create a map:** create the directory, `map.md`, and `tickets/`.
- **Create a ticket:** write the ticket file, then add its linked index line to **Open tickets**.
- **Wire blocking:** add relative links under **Blocked by** after all ticket files exist.
- **Find the frontier:** inspect open tickets in map order; a ticket is available when its claim is
  `unclaimed` and every linked blocker is closed.
- **Claim:** set **Claim** before doing any work. Re-read first to avoid overwriting another claim.
- **Resolve:** fill **Resolution**, set status to `closed`, remove the ticket from **Open tickets**,
  and append its linked one-line gist to the map's **Decisions so far**.
- **Rule out of scope:** close the ticket, remove it from **Open tickets**, and link the reason under
  the map's **Out of scope** instead of **Decisions so far**.

Use linked titles in narration. Paths are identifiers for tools, not names for humans.
