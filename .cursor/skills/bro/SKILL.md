---
name: bro
description: Restate the last assistant message in plain human language with no jargon. Use when the user invokes /bro or asks to simplify, de-jargon, or explain the last reply like a human.
disable-model-invocation: true
user-invocable: true
---

# Bro

Restate your last message. Stop using jargon and speak coherently. State it more simply and concisely, like one human talking to another.

If ADHD mode is active (default via `.cursor/rules/i-have-adhd.mdc`, unless the user said
"stop adhd mode" / "normal mode"), keep the restatement **action-first**: next step on line one,
numbered steps if multi-step, one concrete closer. Bro owns plain language;
`.cursor/skills/i-have-adhd/SKILL.md` owns shape.
