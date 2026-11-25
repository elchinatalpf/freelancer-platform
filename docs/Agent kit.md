# Agent kit

Files Claude Code creates in Phase 0, and the prompts you paste at each step.

## CLAUDE.md

Claude Code reads this file at the start of every session, so it stays short and holds only rules that apply to every step. Step 0.4 creates it at the repo root.

```markdown
# Empowered Professional Platform
Multi-tenant site builder for freelancers. One Next.js 16 app at the repo root, pnpm.
Architecture decisions: docs/adr/. The current step's spec: docs/specs/<step id>.md.

## Commands
pnpm dev | pnpm check (typecheck, lint, unit, integration) | pnpm test:e2e | pnpm db:migrate

## Layout
src/app/             routes: (app) dashboard and editor, (sites) public pages
src/features/<name>/ UI and Server Actions for one feature
src/server/          Data Access Layer, the only code that imports the database client
src/contracts/       zod schemas shared by forms, actions and page blocks
tests/               unit, integration (real Postgres), e2e (Playwright)
tests/security/      red-team tests; protected

## Non-negotiables
- Only src/server/ touches Postgres (import 'server-only'). Every tenant query runs
  inside withTenant() over the Neon WebSocket Pool, never neon-http.
- Every Server Action and Route Handler calls requireWorkspace() first.
  tenant_id comes from the session, never from request input.
- Every new tenant table gets tenant_id, RLS enabled and forced, the nullif policy
  and an isolation test. The schema test fails otherwise.
- Validate all input with src/contracts. Server Actions return ActionResult<T>;
  Route Handler errors are RFC 9457 problem+json.
- No raw HTML, script or embed blocks. Rich text renders on the server.
- Never read or print .env files. Add a dependency only if the spec names it.
- Branches: step/<id>-<slug> for features, kit/<slug> for .claude/ or docs/adr/
  changes, redteam/phase-<n> for red-team tests. A hook enforces what each may edit.
- If the spec conflicts with an ADR, stop and say so. Do not work around it.

## Definition of done
pnpm check green; new behavior has tests; the spec's acceptance tests pass;
the PR body follows .github/pull_request_template.md, including "How this works".

## Conventions
kebab-case files, PascalCase components, camelCase functions.
Copy the patterns in src/features/workspace-profile/ (the golden slice).
```

## Settings and hooks

Permissions say what Claude Code may do; hooks enforce the rules that must never depend on the model remembering them. Step 0.4 creates these three files on a `kit/` branch. Step 0.4 also adds a minimal `check` script (typecheck and lint) so the done-gate works before step 0.5 extends it.

**`.claude/settings.json`**

```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./.env.*.local)",
      "Edit(./.env)",
      "Edit(./.env.local)",
      "Edit(./.env.*.local)",
      "Bash(cat .env*)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(rm -rf *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(gh pr merge *)",
      "Bash(pnpm add *)",
      "Bash(pnpm remove *)",
      "Bash(curl *)"
    ],
    "allow": [
      "Bash(pnpm check)",
      "Bash(pnpm test *)",
      "Bash(pnpm lint *)",
      "Bash(pnpm typecheck)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(gh issue view *)",
      "Bash(gh pr view *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-paths.mjs"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/done-gate.mjs",
            "timeout": 600
          }
        ]
      }
    ]
  }
}
```

Deny rules beat allow rules, and a `Read` deny stops Claude's file tools but not every shell command, which is why the hook below also blocks secrets files. Hooks run through Git Bash on Windows, which the Git installer provides.

**`.claude/hooks/protect-paths.mjs`** blocks edits by branch: feature branches cannot touch `tests/security/`, the agent kit, ADRs, secrets files or applied migrations; `redteam/` branches can write only security tests and gate reports; `kit/` branches may change the kit and ADRs. Tested on all of these cases before publishing.

```js
// PreToolUse hook: blocks edits the current branch may not make.
// Exit 2 blocks the edit; the message on stderr tells Claude why.
// Claude Code lets an edit through on any other exit code, so an error must exit 2 too.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const MIGRATIONS_DIR = 'drizzle/'; // step 1.1 confirms this path

// macOS and Windows file systems ignore case, so compare paths in lowercase there.
const norm = (p) => {
  const s = String(p).replaceAll('\\', '/');
  return ['win32', 'darwin'].includes(process.platform) ? s.toLowerCase() : s;
};

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (!file) process.exit(0);

  const root = norm(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
  const rel = path.posix.relative(root, norm(file));
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

  const block = (why) => {
    console.error(`Blocked: ${rel} on branch ${branch}. ${why} Stop and ask the user.`);
    process.exit(2);
  };

  if (rel.startsWith('..')) block('The file is outside the project.');
  if (/(^|\/)\.env(\.[^/]*)?$/.test(rel) && !rel.endsWith('.env.example')) block('It is a secrets file.');

  const isSecurityTest = rel.startsWith('tests/security/');
  const isKit = rel.startsWith('.claude/') || rel.startsWith('docs/adr/') || rel === 'claude.md' || rel === 'CLAUDE.md';
  const isAppliedMigration = rel.startsWith(MIGRATIONS_DIR) && rel.endsWith('.sql') && existsSync(file);

  if (branch.startsWith('redteam/')) {
    if (!isSecurityTest && !rel.startsWith('docs/gates/')) block('Red-team branches may only add tests in tests/security/.');
  } else {
    if (isSecurityTest) block('tests/security/ belongs to the red team.');
    if (isKit && !branch.startsWith('kit/')) block('The agent kit and ADRs change only on kit/ branches.');
    if (isAppliedMigration) block('Applied migrations are never edited; write a new migration.');
  }
  process.exit(0);
} catch (err) {
  console.error(`protect-paths failed: ${err}`);
  process.exit(2);
}
```

**`.claude/hooks/done-gate.mjs`** runs `pnpm check` whenever Claude tries to finish with changes on the branch, and sends it back to work if anything fails. Start Docker before a build session, because the integration tests need the local Postgres.

```js
// Stop hook: Claude may not finish while `pnpm check` fails on a branch with changes.
// Exit 2 sends Claude back to work with the failing output. Claude Code ends a
// loop after eight blocks in a row, and CI is the backstop after that.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8'));
const sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const tryRun = (cmd) => {
  try { return sh(cmd); } catch { return ''; } // e.g. no origin/main yet
};
const changed = tryRun('git status --porcelain') + tryRun('git diff --name-only origin/main...HEAD');
if (!changed) process.exit(0); // nothing changed: Claude was answering, not building

try {
  execSync('pnpm check', { encoding: 'utf8', stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 });
  process.exit(0);
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  const again = input.stop_hook_active ? ' again' : '';
  console.error(`pnpm check failed${again}. Fix it before finishing. Last output:\n${out.slice(-3000)}`);
  process.exit(2);
}
```

## Subagents

Each subagent runs in its own context with its own model and tools, so the reviewer never grades work it wrote. Files go in `.claude/agents/`; the `name` field is how you call them ("use the reviewer subagent on PR #12").

**`.claude/agents/spec-writer.md`**

```markdown
---
name: spec-writer
description: Writes the task spec for one playbook step before any code. Use when starting a step.
tools: Read, Grep, Glob, Write, Bash
model: opus
---
You write docs/specs/<step id>.md for exactly one step, from docs/specs/_template.md.
Read CLAUDE.md, the ADRs the step touches, and the code it will change.
- Goal in two sentences a non-developer understands.
- Files to create, files to change, files that must not change.
- Acceptance tests as Given / When / Then, each one automatable.
- Security risks for this step, each with the test that covers it.
- A conflict with an ADR, or a decision you cannot make, goes under Open questions,
  and then you stop.
- One page at most. No code beyond type signatures.
Then run gh issue create with the title "<step id> <step name>", the spec as the body,
and the milestone "Phase <n>".
```

**`.claude/agents/reviewer.md`**

```markdown
---
name: reviewer
description: Reviews one pull request against its spec, CLAUDE.md and the ADRs. Use on every PR before merge. Never edits files.
tools: Read, Grep, Glob, Bash
model: opus
---
You review; you never change files. Use Bash only for git diff, git log,
gh pr view, gh pr diff and gh pr comment.
1. Read the spec, CLAUDE.md and every ADR the diff touches. Read the whole diff.
2. Check in this order: tenant isolation (withTenant, tenant id from the session);
   requireWorkspace() in every Server Action and Route Handler; input validation;
   error handling; tests that would fail if the code were wrong; structure against
   src/features/workspace-profile/; new dependencies.
3. Each problem: file and line, what is wrong, why it matters, the fix.
   Label it BLOCKER, SHOULD or NIT.
4. Two lines on what is solid and why.
5. Verdict APPROVE only with zero BLOCKERs. Post with gh pr comment.
Do not approve to be agreeable. When unsure whether something is a bug, say so and
name the test that would settle it.
```

**`.claude/agents/red-team.md`**

```markdown
---
name: red-team
description: Attacks the app at a phase gate and proves each finding with a failing test. Use only at phase gates, on a redteam/phase-<n> branch.
tools: Read, Grep, Glob, Bash, Write, Edit
model: opus
---
You are an attacker who has the source code. You may write only in tests/security/
and docs/gates/; a hook blocks everything else.
Always try: reading or changing another workspace's data; calling Server Actions and
Route Handlers with no session or with another workspace's ids; bypassing validation.
Then try the phase targets you are given.
- A finding is a test in tests/security/phase-<n>/ that fails now and passes once
  fixed. No failing test, no finding.
- Name each test after the attack: "workspace B cannot read workspace A's draft by id".
- Keep the attacks that already fail as passing tests, so they stay covered.
- Write docs/gates/phase-<n>-redteam.md: each attack, its result, its test file.
- Never weaken an existing test. Never touch src/.
```

**`.claude/agents/explainer.md`**

```markdown
---
name: explainer
description: Writes the plain-language "How this works" note for a pull request. Use after the reviewer approves.
tools: Read, Grep, Glob, Bash
model: sonnet
---
Explain the PR to a junior developer who will defend this code in a job interview.
- The problem it solves, in two sentences.
- One request's path through the code, file by file, quoting the key lines.
- Why it is built this way, with the ADR it follows.
- One question an interviewer might ask, and a short answer.
Under 300 words. Print the note; the main session puts it in the PR body.
```

The reviewer has Bash, so "never edits" is an instruction, not a guarantee. The protect-paths hook still covers the protected paths, and anything else it changed would show up in the diff.

## Templates and the /status skill

Four files keep every step and gate in the same shape, so you always know where to look.

**`docs/specs/_template.md`**

```markdown
# <step id> · <step name>
Phase <n> · Model <Opus|Sonnet|Haiku> · Branch step/<id>-<slug> · Issue #<n>

## Goal
Two sentences a non-developer understands.

## Changes
- Create:
- Change:
- Must not change:

## Acceptance tests
- Given ..., when ..., then ...

## Security
- Risk -> the test that covers it

## Out of scope

## Open questions (must be empty before building)
```

**`.github/pull_request_template.md`**

```markdown
## What
Step <id> · Closes #<issue>

## How this works
(the explainer's note)

## Tests
- Acceptance tests from the spec, each marked pass
- Tests added

## Risk
Touches a migration, src/server/, proxy.ts, the webhook handler, tests/security/
or .claude/? Name which, or write "none".

## Reviewer verdict
(link to the reviewer's comment)

## Skipped or deferred
```

**`docs/gates/_template.md`**

```markdown
# Phase <n> gate · <date>

## Steps merged
<id> · PR #<n>, one line each

## Checks
- CI on main:
- /security-review: findings and what happened to each
- Red team: attacks tried, findings, all fixed?
- Mutation score on src/server/: <x>% (floor <y>%)

## Open risks carried forward

## Result: PASS or FAIL
```

**`.claude/skills/status/SKILL.md`** makes `/status` a command. Custom commands now live in skills, and the `name` becomes the slash command.

```markdown
---
name: status
description: Reports where the build stands and which step is next. Use when the user asks where we are.
---
Change nothing. Run: git branch --show-current, git log --oneline -5,
gh issue list --state open, gh pr list --state open, and list docs/specs/ and docs/gates/.
Reply in this shape:
Phase <n> · <name>
Done: <step ids>
In progress: <step id> · <branch> · PR <state>
Next: <step id> · <name> · <model>
Blocked: <none, or what and why>
Then list which Status cells to change in the playbook tracker.
```

## Prompts

Paste these into Claude Code and fill in the angle brackets. Start each step in a fresh session (`/clear`) and pick the step's model with `/model`.

**1. Start a step (Opus)**

```text
Step <id> from the playbook: <paste the step's row>.
Create branch step/<id>-<slug> from main. Use the spec-writer subagent to write
docs/specs/<id>.md and open the GitHub issue. Stop there; write no code.
```

**2. Build (the step's model)**

```text
Implement docs/specs/<id>.md on branch step/<id>-<slug>. Follow CLAUDE.md and copy
the patterns in src/features/workspace-profile/. Write the acceptance tests first and
show me them failing, then make them pass. Commit in small steps. When pnpm check and
pnpm test:e2e pass, push and open a PR with gh pr create using the PR template.
If the same test fails three times, stop and tell me what you tried.
Do not start any other step.
```

**3. Review and explain (Opus)**

```text
Use the reviewer subagent on PR #<n>. If it approves, use the explainer subagent and
put its note under "How this works" in the PR body.
```

**4. Fix after review (the step's model)**

```text
Fix every BLOCKER and SHOULD in the reviewer's comment on PR #<n>. Change nothing
else. Reply on the PR with the commit that fixed each one, then run the reviewer again.
```

**5. Gate: red team (Opus)**

```text
Phase <n> gate. Create branch redteam/phase-<n> from main. Use the red-team subagent.
Phase targets: <paste the line for this phase below>.
Push the branch and open a draft PR titled "Red team phase <n>". Fix nothing.
Then open one issue per failing test, titled "Fix: <test name>".
```

Phase targets to paste:

- **Phase 1:** every Server Action with another workspace's ids; sign-up joining someone else's workspace; reserved and look-alike slugs; any database access outside `withTenant()`.
- **Phase 2:** save, publish and rollback with another workspace's page ids; script in rich text and block fields; oversized pages; overwriting a newer version.
- **Phase 3:** drafts through the sites host; app cookies on the sites host; one workspace's publish changing another's cache; path tricks in slugs and page names.
- **Phase 4:** uploads into another workspace's prefix; SVG and disguised files; image URLs pointing outside the bucket; location data left in photos; quota bypass.
- **Phase 5:** forged and replayed webhooks; paid limits without paying, by calling actions directly; keeping paid features after a downgrade.
- **Phase 6:** all of the above against the finished app.

**6. Gate: fix a red-team finding (Sonnet)**

```text
Create branch step/<n>.fix-<slug> from redteam/phase-<n>. Make the failing test
"<test name>" pass by fixing src/, never the test. Open a PR to main that closes
issue #<n>.
```

**7. Gate: report (Opus)**

```text
Phase <n> gate report on branch step/<n>-gate. Run /security-review on the changes
since tag phase-<n-1>-done. Run pnpm test:mutation. Fill docs/gates/_template.md
into docs/gates/phase-<n>.md with every result, including the red-team file.
Open a PR. Write PASS only if every check passed.
```

**8. Where are we**

```text
/status
```

**9. When you want to understand a change**

```text
Explain the last commit to me as if I were reviewing it for a job interview:
what it does, the one line that matters most, and what would break without it.
```
