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
