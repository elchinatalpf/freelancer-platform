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
  const isKit = rel.startsWith('.claude/') || rel.startsWith('.github/') || rel.startsWith('docs/adr/') || rel === 'claude.md' || rel === 'CLAUDE.md';
  const isAppliedMigration = rel.startsWith(MIGRATIONS_DIR) && rel.endsWith('.sql') && existsSync(file);

  if (branch.startsWith('redteam/')) {
    if (!isSecurityTest && !rel.startsWith('docs/gates/')) block('Red-team branches may only add tests in tests/security/.');
  } else {
    if (isSecurityTest) block('tests/security/ belongs to the red team.');
    if (isKit && !branch.startsWith('kit/')) block('The agent kit, ADRs and .github/ change only on kit/ branches.');
    if (isAppliedMigration) block('Applied migrations are never edited; write a new migration.');
  }
  process.exit(0);
} catch (err) {
  console.error(`protect-paths failed: ${err}`);
  process.exit(2);
}
