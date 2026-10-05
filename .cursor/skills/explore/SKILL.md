---
name: explore
description: Charts a large, uncertain effort as a shared map of decision tickets and resolves one frontier decision per session. Use when the user invokes /explore, brings a loose idea too large for one agent session, or provides an existing exploration map to continue.
disable-model-invocation: true
user-invocable: true
argument-hint: '<loose idea or map URL/path>'
---

# Explore

Find the route to a large destination before implementation begins. Create a shared map whose
tickets resolve decisions, not slices of delivery work, then advance the map one frontier ticket
at a time.

This project adaptation is based on Matt Pocock's `wayfinder` skill. It uses this repo's available
`grilling`, `research`, and `prototype` skills and does not assume a separate domain-modeling skill.

## Guardrails

- Plan by default. Stop when the route is clear enough to hand off for implementation.
- Never resolve more than one non-research ticket in a session.
- Refer to issues by linked title in human-facing prose, never by a bare number.
- Put each decision's detail in exactly one ticket. The map only links and gives a one-line gist.
- Do not change product behavior unless the map's Notes explicitly carries execution into scope.
- A human-in-the-loop ticket resolves only through a live exchange; never answer for the human.

## Tracker

Prefer this repository's GitHub issue tracker when authenticated issue-write tools are available.
Use the native child-issue, assignee, and dependency relationships the tracker exposes. If those
operations are unavailable, use the local Markdown fallback in [tracker.md](tracker.md) and tell
the user where the map lives.

The map is the canonical index. Give it the `wayfinder:map` label when labels are supported:

```markdown
## Destination

<The spec, decision, or in-place change this exploration must make reachable.>

## Notes

<Domain, required skills, tracker choice, and standing preferences.>

## Decisions so far

- [<closed ticket title>](link): <one-line gist>

## Not yet specified

<In-scope questions that are still too vague to ticket.>

## Out of scope

<Work consciously ruled beyond this destination.>
```

Open tickets are discovered from the map's children or fallback index, not repeated in the map
body. Each ticket has one question:

```markdown
## Question

<The decision or investigation this ticket resolves.>
```

Use one type: `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or
`wayfinder:task`.

## Ticket types

- **Research (AFK):** Find external facts a decision depends on. Invoke `/research`; parallel
  research tickets are the only exception to the one-ticket-per-session rule.
- **Prototype (HITL):** Produce a cheap artifact that makes appearance or behavior concrete.
  Invoke `/prototype`, link the artifact, and wait for the user's reaction.
- **Grilling (HITL):** Resolve a decision through conversation. Invoke `/grilling` and include
  domain-model questions in the design tree.
- **Task (AFK or HITL):** Complete prerequisite manual work that makes a later decision possible.
  It belongs only when it unblocks a decision rather than delivering the destination.

An assignee is the claim. Claim first, before investigation. The frontier is every open,
unblocked, unclaimed child ticket.

## Fog of war

Chart only questions that can be stated precisely now. Keep suspected but still-vague in-scope
questions under **Not yet specified**. Graduate a patch of fog into one or more tickets only after
earlier decisions make those questions precise.

Keep work beyond the Destination under **Out of scope**, never in the fog. If a live ticket proves
out of scope, close it, link the scoping reason under **Out of scope**, and do not add it to
**Decisions so far**.

## Chart a map

Use this mode when the argument is a loose idea:

1. Invoke `/grilling` to name the Destination and model the decisions hanging from it.
2. Grill breadth-first across the whole space to identify the first precise questions and the fog.
3. If there is no fog and the route fits one session, stop and ask whether the user wants a normal
   plan or implementation instead.
4. Create the map with Destination, Notes, empty Decisions so far, fog, and scope boundaries.
5. Create every currently precise ticket, then wire dependencies in a second pass after identities
   exist.
6. Start independent research tickets in parallel with `/research`, recording links to findings.
7. Stop. Charting creates the map; it does not hand-resolve a ticket.

## Continue a map

Use this mode when the argument identifies a map:

1. Load the map's low-resolution body, not every ticket.
2. Use the named ticket or choose the first frontier ticket in tracker order.
3. Claim it before work, then load only the related ticket detail needed.
4. Resolve it with its ticket-type skill.
5. Record the answer as a resolution comment or fallback resolution block, close the ticket, and
   append a linked one-line gist to **Decisions so far**.
6. Create and wire newly precise tickets. Remove graduated fog from **Not yet specified**.
7. Update or close tickets invalidated by the answer, preserving explicit scope decisions.
8. Stop after this ticket unless only independent research tickets remain.

Expect concurrent sessions. Re-read claim, status, and dependencies immediately before writing.
