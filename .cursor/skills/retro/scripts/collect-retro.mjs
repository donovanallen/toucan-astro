#!/usr/bin/env node
/**
 * Collect a ship-retro dataset from git, GitHub (gh), Changesets, and optional
 * Cursor Admin / Actions CI, and emit a normalized JSON document for the Canvas
 * renderer.
 *
 * Usage:
 *   node collect-retro.mjs [options]
 *
 * Options:
 *   --since <date>         Start of window (git approxidate). Default: Monday of
 *                          the current week.
 *   --until <date>         End of window. Default: now.
 *   --preset <name>        this-week | last-7-days | last-14-days.
 *   --repo <path>          Repo working dir. Default: cwd. Repeatable.
 *   --gh-repo <owner/name> GitHub slug. Default: inferred from origin.
 *   --developer <match>    Filter authors (name/email substring).
 *   --scope <prefix>       Restrict to path prefixes. Repeatable.
 *   --out <file>           Output JSON. Default: .digest/digest.json
 *   --skip <list>          Comma list: gh,cursor,ci,compare,changesets
 *   --ci-workflows <list>  Comma workflow names. Default: Test,Release
 *
 * Environment:
 *   CURSOR_ADMIN_KEY       Cursor Admin API key (optional).
 *
 * Optional sources degrade gracefully into sources[].
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
function argAll(name) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === `--${name}` && args[i + 1]) out.push(args[i + 1]);
  }
  return out;
}

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

const preset = arg('preset', 'this-week');
let sinceArg = arg('since', null);
let untilArg = arg('until', null);
if (!sinceArg) {
  if (preset === 'last-7-days') sinceArg = '7 days ago';
  else if (preset === 'last-14-days') sinceArg = '14 days ago';
  else sinceArg = startOfWeek().toISOString();
}
if (!untilArg) untilArg = 'now';

function resolveDate(spec, fallback) {
  if (!spec || spec === 'now') return fallback ?? new Date();
  const rel = String(spec).match(/^(\d+)\s+(day|week|month|year)s?\s+ago$/i);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const d = new Date();
    const unit = rel[2].toLowerCase();
    if (unit === 'day') d.setDate(d.getDate() - n);
    else if (unit === 'week') d.setDate(d.getDate() - n * 7);
    else if (unit === 'month') d.setMonth(d.getMonth() - n);
    else if (unit === 'year') d.setFullYear(d.getFullYear() - n);
    return d;
  }
  const parsed = new Date(spec);
  return Number.isNaN(parsed.getTime()) ? (fallback ?? new Date()) : parsed;
}

const windowSince = resolveDate(sinceArg, startOfWeek());
const windowUntil = resolveDate(untilArg, new Date());
const sinceISO = windowSince.toISOString().slice(0, 10);
const untilISO = windowUntil.toISOString().slice(0, 10);

const repos = argAll('repo');
if (repos.length === 0) repos.push(process.cwd());
const developer = (arg('developer', '') || '').toLowerCase();
const scopes = argAll('scope');
const skip = new Set((arg('skip', '') || '').split(',').filter(Boolean));
const outPath = path.resolve(arg('out', '.digest/digest.json'));
const ciWorkflowNames = (arg('ci-workflows', 'Test,Release') || 'Test,Release')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const sources = [];
function note(name, ok, detail) {
  sources.push({ name, ok, detail });
  process.stderr.write(`[${ok ? 'ok' : 'skip'}] ${name}: ${detail}\n`);
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
    ...opts,
  });
}

const TOOLING_PREFIXES = [
  'ci',
  'build',
  'chore',
  'perf',
  'refactor',
  'docs',
  'style',
];
function categorize(subject, files) {
  const raw = subject.toLowerCase();
  const isBot = /dependabot|renovate/i.test(subject);
  if (isBot || /\bbump\b|build\(deps|\(deps\)/.test(raw)) return 'deps';
  const s = raw.replace(
    /^\[?\s*[a-z]+-\d+(\s*[+,]\s*[a-z]+-\d+)*\s*\]?\s*[:>\-]?\s*/i,
    ''
  );
  const prefix = (s.match(/^(\w+)(\(|:|!)/) || [])[1] || '';
  if (prefix === 'feat') return 'features';
  if (prefix === 'fix') return 'fixes';
  if (prefix === 'test') return 'tests';
  if (prefix === 'ci' || TOOLING_PREFIXES.includes(prefix)) return 'tooling';
  if (/\bci\b|pipeline|workflow|\.changeset\b|turbo|vitest config/.test(s))
    return 'tooling';
  if (/\bvitest\b|\be2e\b|storybook|coverage|de-flake/.test(s)) return 'tests';
  if (
    files.length &&
    files.every(
      (f) =>
        f.startsWith('.github/') ||
        f.startsWith('.cursor/') ||
        f.startsWith('.changeset/') ||
        f.startsWith('docs/')
    )
  ) {
    return 'tooling';
  }
  if (/\bfix\b|hotfix|\bbug\b/.test(s)) return 'fixes';
  if (/\bfeat\b|\bfeature\b/.test(s)) return 'features';
  return 'other';
}

const SEP = '\x1e';
const FSEP = '\x1f';
function collectGitForRepo(repoDir) {
  const fmt = ['%H', '%h', '%an', '%ae', '%aI', '%s'].join(FSEP);
  const raw = run(
    `git -C "${repoDir}" log --no-merges --since="${sinceArg}" --until="${untilArg}" ` +
      `--numstat --date=iso-strict --pretty=format:"${SEP}${fmt}"`
  );
  const commits = [];
  for (const block of raw.split(SEP)) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split('\n');
    const [hash, short, author, email, date, ...subjectParts] =
      lines[0].split(FSEP);
    const subject = subjectParts.join(FSEP);
    let insertions = 0;
    let deletions = 0;
    const files = [];
    for (const l of lines.slice(1)) {
      const m = l.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (!m) continue;
      const add = m[1] === '-' ? 0 : parseInt(m[1], 10);
      const del = m[2] === '-' ? 0 : parseInt(m[2], 10);
      insertions += add;
      deletions += del;
      files.push(m[3]);
    }
    if (developer && !`${author} ${email}`.toLowerCase().includes(developer))
      continue;
    if (
      scopes.length &&
      !files.some((f) => scopes.some((s) => f.startsWith(s)))
    )
      continue;
    const prMatch = subject.match(/\(#(\d+)\)\s*$/);
    commits.push({
      repo: path.basename(repoDir),
      hash,
      short,
      author,
      email,
      date,
      subject,
      pr: prMatch ? parseInt(prMatch[1], 10) : null,
      insertions,
      deletions,
      files,
      category: categorize(subject, files),
    });
  }
  return commits;
}

let commits = [];
for (const r of repos) {
  try {
    const c = collectGitForRepo(r);
    commits = commits.concat(c);
    note(`git:${path.basename(r)}`, true, `${c.length} commits in window`);
  } catch (e) {
    note(
      `git:${path.basename(r)}`,
      false,
      String(e?.message || e).slice(0, 200)
    );
  }
}

const dates = commits.map((c) => c.date).sort();
const window = {
  since: sinceArg,
  until: untilArg,
  preset,
  firstCommit: dates[0] || null,
  lastCommit: dates[dates.length - 1] || null,
};

const byDev = {};
for (const c of commits) {
  const key = c.email || c.author;
  byDev[key] ??= {
    name: c.author,
    email: c.email,
    commits: 0,
    insertions: 0,
    deletions: 0,
    prs: new Set(),
    categories: {},
    areas: {},
    notable: [],
  };
  const d = byDev[key];
  d.commits++;
  d.insertions += c.insertions;
  d.deletions += c.deletions;
  if (c.pr) d.prs.add(c.pr);
  d.categories[c.category] = (d.categories[c.category] || 0) + 1;
  for (const f of c.files) {
    const parts = f.split('/');
    const top =
      parts[0] === 'packages' || parts[0] === 'apps'
        ? `${parts[0]}/${parts[1] || ''}`
        : parts[0];
    d.areas[top] = (d.areas[top] || 0) + 1;
  }
  if (c.category === 'features')
    d.notable.push({ subject: c.subject, pr: c.pr });
}

const developers = Object.values(byDev)
  .map((d) => ({
    ...d,
    prs: [...d.prs].sort((a, b) => a - b),
    net: d.insertions - d.deletions,
    topAreas: Object.entries(d.areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => ({ area: k, count: v })),
    notable: d.notable.slice(0, 6),
  }))
  .sort((a, b) => b.commits - a.commits);

const byCategory = {};
for (const c of commits)
  byCategory[c.category] = (byCategory[c.category] || 0) + 1;

const allPRs = [...new Set(commits.map((c) => c.pr).filter(Boolean))].sort(
  (a, b) => a - b
);

// ---- Changesets -----------------------------------------------------------
function parseChangesetFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fm) return null;
  const packages = {};
  for (const line of fm[1].split('\n')) {
    const m = line.match(
      /^['"]?(@?[^'":\s]+)['"]?\s*:\s*(major|minor|patch)\s*$/
    );
    if (m) packages[m[1]] = m[2];
  }
  const summary = fm[2].trim();
  if (!Object.keys(packages).length && !summary) return null;
  return { packages, summary, id: path.basename(filePath, '.md') };
}

function collectChangesets(repoDir) {
  const dir = path.join(repoDir, '.changeset');
  if (!fs.existsSync(dir)) {
    note('changesets', false, 'no .changeset/ directory');
    return null;
  }
  if (skip.has('changesets')) {
    note('changesets', false, 'skipped via --skip changesets');
    return null;
  }

  const pending = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md') || name === 'README.md') continue;
    const parsed = parseChangesetFile(path.join(dir, name));
    if (parsed)
      pending.push({
        ...parsed,
        file: `.changeset/${name}`,
        status: 'pending',
      });
  }

  let inWindow = [];
  try {
    const changed = run(
      `git -C "${repoDir}" log --since="${sinceArg}" --until="${untilArg}" ` +
        `--diff-filter=A --name-only --pretty=format: -- .changeset/*.md`
    )
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.endsWith('.md') && !s.endsWith('README.md'));
    const uniq = [...new Set(changed)];
    for (const rel of uniq) {
      const abs = path.join(repoDir, rel);
      if (!fs.existsSync(abs)) {
        inWindow.push({
          file: rel,
          status: 'consumed-or-removed',
          packages: {},
          summary: null,
        });
        continue;
      }
      const parsed = parseChangesetFile(abs);
      if (parsed)
        inWindow.push({ ...parsed, file: rel, status: 'added-in-window' });
    }
  } catch (e) {
    note('changesets:git', false, String(e?.message || e).slice(0, 200));
  }

  const packageBumps = {};
  for (const cs of [...pending, ...inWindow]) {
    for (const [pkg, bump] of Object.entries(cs.packages || {})) {
      packageBumps[pkg] ??= { major: 0, minor: 0, patch: 0 };
      packageBumps[pkg][bump]++;
    }
  }

  note(
    'changesets',
    true,
    `${pending.length} pending · ${inWindow.length} added in window · ` +
      `${Object.keys(packageBumps).length} packages touched`
  );
  return {
    pending,
    inWindow,
    packageBumps,
    ignoredApps: ['web'],
  };
}

let changesets = null;
for (const r of repos) {
  const cs = collectChangesets(r);
  if (cs) {
    changesets = changesets
      ? {
          pending: [...changesets.pending, ...cs.pending],
          inWindow: [...changesets.inWindow, ...cs.inWindow],
          packageBumps: { ...changesets.packageBumps, ...cs.packageBumps },
          ignoredApps: cs.ignoredApps,
        }
      : cs;
  }
}

// ---- GitHub PR enrichment -------------------------------------------------
let pullRequests = [];
let ghRepo = arg('gh-repo', null);
if (!ghRepo) {
  try {
    const url = run(`git -C "${repos[0]}" remote get-url origin`).trim();
    const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)(\.git)?$/);
    if (m) ghRepo = m[1];
  } catch {
    /* ignore */
  }
}

if (skip.has('gh')) {
  note('github', false, 'skipped via --skip gh');
} else if (!ghRepo) {
  note('github', false, 'could not infer gh repo slug');
} else {
  try {
    run('gh auth status', { stdio: ['ignore', 'ignore', 'ignore'] });
    const json = run(
      `gh pr list --repo ${ghRepo} --state merged --search "merged:${sinceISO}..${untilISO}" ` +
        `--limit 200 --json number,title,author,mergedAt,additions,deletions,` +
        `changedFiles,reviews,labels,url,body`
    );
    const prs = JSON.parse(json);
    const wanted = new Set(allPRs);
    pullRequests = prs
      .filter((p) => wanted.size === 0 || wanted.has(p.number))
      .map((p) => ({
        number: p.number,
        title: p.title,
        author: p.author?.login,
        authorName: p.author?.name,
        mergedAt: p.mergedAt,
        additions: p.additions,
        deletions: p.deletions,
        changedFiles: p.changedFiles,
        reviewers: [
          ...new Set(
            (p.reviews || []).map((r) => r.author?.login).filter(Boolean)
          ),
        ],
        labels: (p.labels || []).map((l) => l.name),
        url: p.url,
      }));
    note(
      'github',
      true,
      `${pullRequests.length} merged PRs matched (repo ${ghRepo})`
    );
  } catch (e) {
    note('github', false, String(e?.message || e).slice(0, 200));
  }
}

let openPRs = [];
function readinessOf(p) {
  if (p.isDraft) return 'draft';
  if (p.reviewDecision === 'APPROVED') return 'ready';
  if (p.reviewDecision === 'CHANGES_REQUESTED') return 'changes-requested';
  return 'in-review';
}
if (!skip.has('gh') && ghRepo) {
  try {
    const json = run(
      `gh pr list --repo ${ghRepo} --state open --limit 100 ` +
        `--json number,title,author,isDraft,createdAt,updatedAt,reviewDecision,labels,url`
    );
    openPRs = JSON.parse(json).map((p) => ({
      number: p.number,
      title: p.title,
      author: p.author?.login,
      isDraft: p.isDraft,
      readiness: readinessOf(p),
      reviewDecision: p.reviewDecision || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      labels: (p.labels || []).map((l) => l.name),
      url: p.url,
    }));
    const byReady = openPRs.reduce(
      (a, p) => ((a[p.readiness] = (a[p.readiness] || 0) + 1), a),
      {}
    );
    note(
      'github:openPRs',
      true,
      `${openPRs.length} open (${Object.entries(byReady)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ')})`
    );
  } catch (e) {
    note('github:openPRs', false, String(e?.message || e).slice(0, 200));
  }
}

// ---- CI (Test / Release workflows) ----------------------------------------
function ghJson(endpoint) {
  return JSON.parse(
    run(`gh api "${endpoint}"`, { stdio: ['ignore', 'pipe', 'ignore'] })
  );
}

const avg = (a) =>
  a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null;
const durSec = (a, b) =>
  a && b ? Math.round((new Date(b) - new Date(a)) / 1000) : null;

function workflowWindowStats(wfId, createdFilter) {
  const runsRes = ghJson(
    `repos/${ghRepo}/actions/workflows/${wfId}/runs?created=${createdFilter}&per_page=100`
  );
  const wfRuns = runsRes.workflow_runs || [];
  const conclusions = {};
  const durations = [];
  for (const r of wfRuns) {
    const k = r.conclusion || r.status;
    conclusions[k] = (conclusions[k] || 0) + 1;
    if ((r.conclusion || r.status) === 'success') {
      const d = durSec(r.run_started_at || r.created_at, r.updated_at);
      if (d != null) durations.push(d);
    }
  }
  return {
    runCount: wfRuns.length,
    conclusions,
    avgSec: avg(durations),
    samples: durations.length,
  };
}

let ci = null;
async function fetchCI() {
  if (skip.has('ci')) return note('ci', false, 'skipped via --skip ci');
  if (!ghRepo) return note('ci', false, 'no gh repo slug');
  try {
    run('gh auth status', { stdio: ['ignore', 'ignore', 'ignore'] });
  } catch {
    return note('ci', false, 'gh not authenticated');
  }
  try {
    const wfs =
      ghJson(`repos/${ghRepo}/actions/workflows?per_page=100`).workflows || [];
    const workflows = [];
    for (const name of ciWorkflowNames) {
      const wf = wfs.find((w) => w.name === name);
      if (!wf) {
        note(`ci:${name}`, false, `workflow "${name}" not found`);
        continue;
      }
      const cur = workflowWindowStats(wf.id, `${sinceISO}..${untilISO}`);
      const timing = {
        avgSec: cur.avgSec,
        samples: cur.samples,
        prev: null,
        delta: null,
      };
      if (!skip.has('compare') && cur.avgSec != null) {
        try {
          const dayMs = 864e5;
          const curSince = new Date(`${sinceISO}T00:00:00Z`);
          const curUntil = new Date(`${untilISO}T00:00:00Z`);
          const spanDays = Math.max(
            0,
            Math.round((curUntil.getTime() - curSince.getTime()) / dayMs)
          );
          const prevUntil = new Date(curSince.getTime() - dayMs);
          const prevSince = new Date(prevUntil.getTime() - spanDays * dayMs);
          const prevSinceISO = prevSince.toISOString().slice(0, 10);
          const prevUntilISO = prevUntil.toISOString().slice(0, 10);
          const prev = workflowWindowStats(
            wf.id,
            `${prevSinceISO}..${prevUntilISO}`
          );
          timing.prev = {
            window: { since: prevSinceISO, until: prevUntilISO },
            avgSec: prev.avgSec,
            samples: prev.samples,
          };
          timing.delta = {
            avgSec:
              timing.avgSec != null && prev.avgSec != null
                ? timing.avgSec - prev.avgSec
                : null,
          };
        } catch {
          /* ignore compare failures */
        }
      }
      workflows.push({
        name,
        runCount: cur.runCount,
        conclusions: cur.conclusions,
        timing,
      });
      note(
        `ci:${name}`,
        true,
        `${cur.runCount} runs · ok ${cur.conclusions.success || 0} / fail ${cur.conclusions.failure || 0}` +
          (cur.avgSec != null ? ` · ~${cur.avgSec}s` : '')
      );
    }

    const testWf = workflows.find((w) => w.name === 'Test');
    const hotfixes = commits.filter((c) => /hotfix/i.test(c.subject));
    const incidents = {
      hotfixes: hotfixes.length,
      hotfixSubjects: hotfixes.map((c) => ({ subject: c.subject, pr: c.pr })),
      brokenMainBuilds: testWf ? testWf.conclusions.failure || 0 : null,
    };
    ci = { workflows, incidents };
  } catch (e) {
    note('ci', false, String(e?.message || e).slice(0, 200));
  }
}

// ---- Cursor Admin API (optional) ------------------------------------------
let cursor = null;
async function fetchCursor() {
  const key = process.env.CURSOR_ADMIN_KEY;
  if (skip.has('cursor'))
    return note('cursor', false, 'skipped via --skip cursor');
  if (!key) return note('cursor', false, 'CURSOR_ADMIN_KEY not set');
  const authHeader = 'Basic ' + Buffer.from(`${key}:`).toString('base64');
  try {
    const membersRes = await fetch('https://api.cursor.com/teams/members', {
      headers: { Authorization: authHeader },
    });
    if (!membersRes.ok) throw new Error(`members HTTP ${membersRes.status}`);
    const members = (await membersRes.json()).teamMembers || [];

    const startMs = windowSince.getTime();
    const endMs = windowUntil.getTime();
    const usageRes = await fetch(
      'https://api.cursor.com/teams/daily-usage-data',
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate: startMs, endDate: endMs }),
      }
    );
    if (!usageRes.ok) throw new Error(`usage HTTP ${usageRes.status}`);
    const usage = (await usageRes.json()).data || [];

    const perUser = {};
    for (const row of usage) {
      const u = (perUser[row.email] ??= {
        email: row.email,
        activeDays: 0,
        linesAdded: 0,
        acceptedLines: 0,
        tabsAccepted: 0,
        agentRequests: 0,
        chatRequests: 0,
        composerRequests: 0,
        bugbotUsages: 0,
        models: {},
      });
      if (row.isActive) u.activeDays++;
      u.linesAdded += row.totalLinesAdded || 0;
      u.acceptedLines += row.acceptedLinesAdded || 0;
      u.tabsAccepted += row.totalTabsAccepted || 0;
      u.agentRequests += row.agentRequests || 0;
      u.chatRequests += row.chatRequests || 0;
      u.composerRequests += row.composerRequests || 0;
      u.bugbotUsages += row.bugbotUsages || 0;
      if (row.mostUsedModel)
        u.models[row.mostUsedModel] = (u.models[row.mostUsedModel] || 0) + 1;
    }
    const perUserArr = Object.values(perUser).map((u) => ({
      ...u,
      topModel:
        Object.entries(u.models).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    }));
    cursor = {
      memberCount: members.filter((m) => !m.isRemoved).length,
      members: members.map((m) => ({
        name: m.name,
        email: m.email,
        role: m.role,
      })),
      window: { startMs, endMs },
      perUser: perUserArr,
      totals: {
        agentRequests: perUserArr.reduce((s, u) => s + u.agentRequests, 0),
        chatRequests: perUserArr.reduce((s, u) => s + u.chatRequests, 0),
        acceptedLines: perUserArr.reduce((s, u) => s + u.acceptedLines, 0),
        tabsAccepted: perUserArr.reduce((s, u) => s + u.tabsAccepted, 0),
        bugbotUsages: perUserArr.reduce((s, u) => s + u.bugbotUsages, 0),
      },
    };
    note('cursor', true, `${perUserArr.length} members with usage in window`);
  } catch (e) {
    note('cursor', false, String(e?.message || e).slice(0, 200));
  }
}

await fetchCI();
await fetchCursor();

if (cursor) {
  const usageByEmail = new Map(
    cursor.perUser.map((u) => [u.email?.toLowerCase(), u])
  );
  const emailByName = new Map(
    cursor.members.map((m) => [m.name?.toLowerCase(), m.email?.toLowerCase()])
  );
  for (const dev of developers) {
    let u = usageByEmail.get(dev.email?.toLowerCase());
    if (!u) {
      const mappedEmail = emailByName.get(dev.name?.toLowerCase());
      if (mappedEmail) u = usageByEmail.get(mappedEmail);
    }
    if (u) {
      dev.cursor = {
        email: u.email,
        activeDays: u.activeDays,
        agentRequests: u.agentRequests,
        chatRequests: u.chatRequests,
        composerRequests: u.composerRequests,
        acceptedLines: u.acceptedLines,
        tabsAccepted: u.tabsAccepted,
        bugbotUsages: u.bugbotUsages,
        topModel: u.topModel,
      };
    }
  }
}

const digest = {
  generatedAt: new Date().toISOString(),
  window,
  repos: repos.map((r) => path.basename(r)),
  ghRepo,
  filters: { developer: developer || null, scopes },
  totals: {
    commits: commits.length,
    features: byCategory.features || 0,
    fixes: byCategory.fixes || 0,
    tests: byCategory.tests || 0,
    tooling: byCategory.tooling || 0,
    deps: byCategory.deps || 0,
    prs: allPRs.length,
    changesetsPending: changesets?.pending?.length || 0,
    changesetsInWindow: changesets?.inWindow?.length || 0,
    insertions: commits.reduce((s, c) => s + c.insertions, 0),
    deletions: commits.reduce((s, c) => s + c.deletions, 0),
    contributors: developers.filter((d) => !/dependabot|renovate/i.test(d.name))
      .length,
  },
  byCategory,
  developers,
  commits,
  pullRequests,
  changesets,
  ci,
  comingSoon: { openPRs },
  cursor,
  sources,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(digest, null, 2));
process.stderr.write(
  `\nWrote ${outPath}\n  ${digest.totals.commits} commits, ${digest.totals.prs} PRs, ` +
    `${digest.totals.changesetsPending} pending changesets, ` +
    `${digest.totals.contributors} contributors\n`
);
