// Test cases for protect-paths.mjs. Run: node .claude/hooks/protect-paths.cases.mjs
// Each case runs the hook as Claude Code does (JSON on stdin, cwd and
// CLAUDE_PROJECT_DIR set to the project) in its own throwaway git repo.
// A case passes when the exit code matches and, for exit 2, so does the reason:
// a policy block and a crashing hook both exit 2. Any failure exits non-zero.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('./protect-paths.mjs', import.meta.url));
// The platforms on which the hook compares paths in lowercase.
const IGNORES_CASE = ['win32', 'darwin'].includes(process.platform);
// Without GIT_*, a caller such as a git hook cannot point git at the real repo.
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const STEP = 'step/0.5-test';
const KIT = 'kit/test';
const RED = 'redteam/phase-1';
const BLOCKED = 'Blocked:';
const ERROR = 'protect-paths failed:';

// [id, branch, tool, target, expected exit, options]
// target is relative to the throwaway repo, or absolute; null sends no path.
const CASES = [
  [1, STEP, 'Write', 'tests/security/probe.test.ts', 2],
  [2, STEP, 'Edit', 'tests/security/existing.test.ts', 2],
  [3, STEP, 'Write', '.claude/settings.json', 2],
  [4, STEP, 'Write', 'docs/adr/0004-read-write-path.md', 2],
  [5, STEP, 'Write', 'CLAUDE.md', 2],
  [6, STEP, 'Write', 'src/features/health/get-health.ts', 0],
  [7, STEP, 'Write', 'tests/unit/get-health.test.ts', 0],
  [8, STEP, 'Write', '.env', 2],
  [9, STEP, 'Write', '.env.local', 2],
  [10, STEP, 'Write', '.env.example', 0],
  [11, STEP, 'Write', 'drizzle/0001_init.sql', 2, { note: ' (applied)' }],
  [12, STEP, 'Write', 'drizzle/0002_add_pages.sql', 0, { note: ' (new)' }],
  [13, STEP, 'Write', '/etc/hosts', 2, { note: ' (outside project)' }],
  [14, STEP, 'Write', '../outside/notes.txt', 2, { note: ' (outside project)' }],
  [15, STEP, 'NotebookEdit', 'tests/security/attack.ipynb', 2, { note: ' (notebook_path)' }],
  [16, STEP, 'NotebookEdit', 'notebooks/analysis.ipynb', 0, { note: ' (notebook_path)' }],
  [17, STEP, 'Write', null, 0, { note: '(no path)' }],
  [18, KIT, 'Write', '.claude/settings.json', 0],
  [19, KIT, 'Write', 'docs/adr/0004-read-write-path.md', 0],
  [20, KIT, 'Write', 'CLAUDE.md', 0],
  [21, KIT, 'Write', 'tests/security/probe.test.ts', 2],
  [22, KIT, 'Write', '.env.production', 2],
  [23, RED, 'Write', 'tests/security/phase-1/probe.test.ts', 0],
  [24, RED, 'Write', 'docs/gates/phase-1-redteam.md', 0],
  [25, RED, 'Write', 'src/app/page.tsx', 2],
  [26, RED, 'Write', '.claude/settings.json', 2],
  [27, RED, 'Write', '.env', 2],

  // The tests for review findings S2 (fail closed) and S3 (path case).
  [28, STEP, 'stdin', null, 2, { stdin: '{', note: '"{" piped in (S2)', reason: ERROR }],
  [29, STEP, 'Write', 'Tests/Security/probe.ts', 2, {
    note: ' (S3)',
    skip: !IGNORES_CASE && `skipped on ${process.platform}: the hook keeps path case there`,
  }],

  // Extra checks.
  ['X1', STEP, 'stdin', null, 2, { stdin: '', note: '(empty stdin)', reason: ERROR }],
  ['X2', STEP, 'stdin', null, 2, { stdin: 'null', note: '"null" piped in', reason: ERROR }],
  ['X3', STEP, 'Write', 'src/a.ts', 2, { note: ', repo has no commits', commit: false, reason: ERROR }],
  ['X4', STEP, 'Write', '.Claude/settings.json', IGNORES_CASE ? 2 : 0],
  ['X5', STEP, 'Write', 'Claude.md', IGNORES_CASE ? 2 : 0],
  ['X6', RED, 'Write', 'Tests/Security/x.ts', IGNORES_CASE ? 0 : 2],
];

function makeRepo(dir, branch, commit) {
  mkdirSync(path.join(dir, 'drizzle'), { recursive: true });
  const git = (...args) =>
    execFileSync(
      'git',
      ['-c', 'user.name=cases', '-c', 'user.email=cases@example.invalid',
        '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args],
      { cwd: dir, env: ENV, stdio: 'pipe' },
    );
  git('init', '-q', '-b', branch);
  writeFileSync(path.join(dir, 'drizzle', '0001_init.sql'), 'select 1;\n'); // applied migration
  if (commit) {
    git('add', '-A');
    git('commit', '-q', '-m', 'init');
  }
}

function hookInput(repo, tool, target) {
  const key = tool === 'NotebookEdit' ? 'notebook_path' : 'file_path';
  const toolInput = target === null ? {} : { [key]: path.resolve(repo, target) };
  return JSON.stringify({ tool_name: tool, tool_input: toolInput });
}

const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), 'protect-paths-')));
const tally = { pass: 0, fail: 0, skipped: 0 };
try {
  for (const [id, branch, tool, target, expected, options = {}] of CASES) {
    const label = `${target ?? ''}${options.note ?? ''}`;
    const row = `${String(id).padStart(3)}  ${branch.padEnd(15)} ${tool.padEnd(12)} ${label.padEnd(46)}`;
    if (options.skip) {
      tally.skipped++;
      console.log(`${row} ${options.skip}`);
      continue;
    }
    const repo = path.join(tmp, String(id), 'repo');
    makeRepo(repo, branch, options.commit ?? true);
    const result = spawnSync(process.execPath, [HOOK], {
      cwd: repo,
      env: { ...ENV, CLAUDE_PROJECT_DIR: repo },
      input: options.stdin ?? hookInput(repo, tool, target),
      encoding: 'utf8',
    });
    const stderr = result.stderr ?? '';
    const wrongReason =
      expected === 2 && result.status === 2 && !stderr.includes(options.reason ?? BLOCKED);
    const ok = result.status === expected && !wrongReason;
    tally[ok ? 'pass' : 'fail']++;
    console.log(`${row} expect ${expected}  got ${result.status}  ${ok ? 'pass' : 'FAIL'}`);
    if (!ok) console.log(`     ${wrongReason ? 'wrong reason; ' : ''}stderr: ${stderr.trim()}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(
  `\n${CASES.length} cases on ${process.platform}: ` +
    `${tally.pass} pass, ${tally.fail} fail, ${tally.skipped} skipped`,
);
process.exitCode = tally.fail ? 1 : 0;
