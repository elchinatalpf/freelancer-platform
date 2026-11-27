// CI's guard: may this kind of branch change these files, and are the scripts the
// done-gate runs still the pinned ones? protect-paths.mjs sees only Claude Code's
// file edits, so this is the backstop for shell commands (PR #2, finding S4).
// A pull request runs its own copy of this file, so it catches slips, not a
// deliberate rewrite: read the whole diff of any PR that touches .github/.
// Plain Node, no dependencies. Run it from the repository root.
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Quoted, a branch or file name cannot start a log line of its own, which GitHub
// Actions could read as a command.
const quote = (text) => JSON.stringify(text);

// The folder's own name counts too: a symlink or submodule shows up as that.
const within = (file, folder) =>
  file === folder || file.startsWith(`${folder}/`);

const STEP_FOLDERS = [".claude", ".github", "docs/adr", "tests/security"];
const STEP_NAMES = [".mcp.json", "claude.local.md", "claude.md"]; // at any depth
const KIT_FOLDERS = ["src", "tests"];
const REDTEAM_PREFIXES = ["docs/gates/", "tests/security/"];

// Per branch prefix: is this path forbidden? Deny rules ignore case, since on a
// Mac Tests/Security/ is tests/security/. The redteam/ allowlist keeps exact
// case, so a near miss fails.
const FORBIDDEN = {
  "step/": (file) => {
    const lower = file.toLowerCase();
    return (
      STEP_FOLDERS.some((folder) => within(lower, folder)) ||
      STEP_NAMES.includes(path.posix.basename(lower))
    );
  },
  "redteam/": (file) =>
    !REDTEAM_PREFIXES.some((prefix) => file.startsWith(prefix)),
  "kit/": (file) =>
    KIT_FOLDERS.some((folder) => within(file.toLowerCase(), folder)),
};

// One message per violation.
export function checkPaths(branch, paths) {
  const kind = Object.keys(FORBIDDEN).find((key) => branch.startsWith(key));
  if (!kind)
    return [
      `Branch ${quote(branch)} has no rules. Name it step/, redteam/ or kit/.`,
    ];
  return paths
    .filter(FORBIDDEN[kind])
    .map((file) => `${kind} branches may not change ${quote(file)}.`);
}

// One message per violation: `check`, and every script it calls with
// `pnpm <script>`, must match its line in .github/check-script.txt.
export function checkScripts(packageJson, pinned) {
  const errors = [];
  const pins = new Map();
  for (const line of pinned.split(/\r?\n/).filter(Boolean)) {
    const colon = line.indexOf(": "); // the first: format:check holds a colon
    const name = line.slice(0, colon);
    if (colon < 1)
      errors.push(
        `.github/check-script.txt has a line without "name: command": ${quote(line)}.`,
      );
    else if (pins.has(name))
      errors.push(
        `Script ${quote(name)} is pinned twice in .github/check-script.txt.`,
      );
    else pins.set(name, line.slice(colon + 2));
  }

  const scripts = JSON.parse(packageJson).scripts ?? {};
  const calls = String(scripts.check).matchAll(/\bpnpm\s+([^\s&|;()<>]+)/g);
  for (const name of new Set(["check", ...Array.from(calls, (m) => m[1])])) {
    if (!Object.hasOwn(scripts, name))
      errors.push(`Script ${quote(name)} is missing from package.json.`);
    else if (!pins.has(name))
      errors.push(
        `Script ${quote(name)} is not pinned in .github/check-script.txt.`,
      );
    else if (scripts[name] !== pins.get(name))
      errors.push(
        `Script ${quote(name)} differs from .github/check-script.txt.`,
      );
  }
  return errors;
}

const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });

// What the pull request would change on main: HEAD, GitHub's merge commit,
// against its first parent. So a branch that merged main lists only its own
// changes. Throws, and so fails the guard, whenever the list cannot be trusted.
function changedPaths(headSha) {
  const [, base, head, ...more] = git(
    "rev-list",
    "--parents",
    "--max-count=1",
    "HEAD",
  )
    .trim()
    .split(" ");
  if (!head || head !== headSha || more.length > 0)
    throw new Error(
      `HEAD is not the merge commit of the pull request's head ${quote(headSha)}.`,
    );
  const paths = git(
    "diff",
    "--name-only",
    "--no-renames", // a rename lists the old path too
    "--ignore-submodules=none", // .gitmodules cannot hide one
    "-z", // names as they are, not quoted
    base,
    "HEAD",
  )
    .split("\0")
    .filter(Boolean);
  if (paths.length === 0)
    throw new Error("git lists no changed file, so there is nothing to check.");
  return paths;
}

function checkPullRequest() {
  const event = readFileSync(process.env.GITHUB_EVENT_PATH, "utf8");
  const { head } = JSON.parse(event).pull_request;
  const from = head.repo?.full_name;
  if (!from)
    return [
      "The pull request's head repository is missing, as for a deleted fork.",
    ];
  if (from !== process.env.GITHUB_REPOSITORY)
    return [
      `A pull request from another repository fails: its head is in ${quote(from)}.`,
    ];
  return checkPaths(head.ref, changedPaths(head.sha));
}

// A pull request gets the branch rules and the pins; a push to main, the pins.
function guard() {
  const event = process.env.GITHUB_EVENT_NAME;
  const errors = [];
  if (event === "pull_request") errors.push(...checkPullRequest());
  else if (event !== "push")
    errors.push(`The guard has no rules for the event ${quote(event)}.`);
  const pins = checkScripts(
    readFileSync("package.json", "utf8"),
    readFileSync(".github/check-script.txt", "utf8"),
  );
  return [...errors, ...pins];
}

// Runs when executed, not when the tests import it. realpath, so that a
// symlinked path cannot turn the guard into a silent pass.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  let errors;
  try {
    errors = guard();
  } catch (error) {
    errors = [error.message];
  }
  for (const message of errors) console.error(message);
  if (errors.length === 0) console.log("The guard passes.");
  process.exitCode = errors.length === 0 ? 0 : 1;
}
