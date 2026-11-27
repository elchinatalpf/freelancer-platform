// Tests for guard.mjs and ci.yml. Run: node --test .github/scripts/guard.test.mjs
// The numbers are the acceptance tests in docs/specs/0.6.md. No dependencies:
// the guard job installs nothing.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { checkPaths, checkScripts } from "./guard.mjs";

const GUARD = fileURLToPath(new URL("./guard.mjs", import.meta.url));
const REPO_ROOT = new URL("../../", import.meta.url);
const BASE_REPO = "owner/platform";
// Without GIT_* and GITHUB_*, neither a git hook nor the CI job that runs these
// tests can point the throwaway repos, or the guard, at the real ones.
const ENV = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^(GIT|GITHUB)_/.test(key)),
);

const SCRIPTS = {
  check: "pnpm typecheck && pnpm lint && pnpm format:check",
  typecheck: "tsc --noEmit",
  lint: "eslint",
  "format:check": "prettier --check .",
  dev: "next dev",
};
const PINNED = `check: ${SCRIPTS.check}
typecheck: ${SCRIPTS.typecheck}
lint: ${SCRIPTS.lint}
format:check: ${SCRIPTS["format:check"]}
`;
const packageJson = (changes = {}) =>
  JSON.stringify({ scripts: { ...SCRIPTS, ...changes } });

// Throwaway repos, built as in .claude/hooks/protect-paths.cases.mjs.
const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), "guard-")));
after(() => rmSync(tmp, { recursive: true, force: true }));

function makeRepo(files = {}) {
  const dir = mkdtempSync(path.join(tmp, "repo-"));
  const git = (...args) =>
    execFileSync(
      "git",
      [
        ...["-c", "user.name=guard", "-c", "user.email=guard@example.invalid"],
        ...["-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null"],
        ...args,
      ],
      { cwd: dir, env: ENV, encoding: "utf8", stdio: "pipe" },
    ).trim();
  const write = (file, text = "x\n") => {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), text);
  };
  const commit = (message) => {
    git("add", "-A");
    git("commit", "-q", "--allow-empty", "-m", message);
  };

  git("init", "-q", "-b", "main");
  const base = {
    "package.json": packageJson(),
    ".github/check-script.txt": PINNED,
    ...files,
  };
  for (const [file, text] of Object.entries(base)) write(file, text);
  commit("base");
  return { dir, git, write, commit };
}

// Leaves HEAD where CI has it: a detached merge of `branch` into main. Returns
// the branch's head SHA, which the event carries.
function mergeCommit(repo, branch) {
  const head = repo.git("rev-parse", branch);
  repo.git("switch", "-q", "--detach", "main");
  repo.git("merge", "-q", "--no-ff", "-m", "merge", branch);
  return head;
}

// A pull request from `branch` that makes `change`.
function pullRequest(branch, change, files) {
  const repo = makeRepo(files);
  repo.git("switch", "-q", "-c", branch);
  change(repo);
  repo.commit("change");
  return { repo, branch, head: mergeCommit(repo, branch) };
}

const adds =
  (...files) =>
  (repo) => {
    for (const file of files) repo.write(file);
  };

let events = 0;
// Runs the guard as the guard job does. `headRepo: null` is a deleted fork.
function runGuard(
  { repo, branch, head },
  { event = "pull_request", headRepo = BASE_REPO } = {},
) {
  const eventPath = path.join(tmp, `event-${++events}.json`);
  const headRepository = headRepo && { full_name: headRepo };
  const payload =
    event === "push"
      ? { ref: "refs/heads/main" }
      : {
          pull_request: {
            head: { ref: branch, sha: head, repo: headRepository },
          },
        };
  writeFileSync(eventPath, JSON.stringify(payload));
  const result = spawnSync(process.execPath, [GUARD], {
    cwd: repo.dir,
    env: {
      ...ENV,
      GITHUB_EVENT_NAME: event,
      GITHUB_EVENT_PATH: eventPath,
      GITHUB_REPOSITORY: BASE_REPO,
    },
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

function passes(result) {
  assert.equal(result.status, 0, result.output);
}

// A crash exits non-zero too, so a failure counts only with the right reason.
function fails(result, ...reasons) {
  assert.equal(result.status, 1, result.output);
  for (const reason of reasons) assert.match(result.output, reason);
}

describe("acceptance test 2: branch rules", () => {
  const rejected = (branch, file) => {
    const messages = checkPaths(branch, [file]);
    assert.equal(messages.length, 1, `${branch} ${file}: ${messages}`);
  };
  const allowed = (branch, ...files) =>
    assert.deepEqual(checkPaths(branch, files), []);

  it("step/ touching tests/security fails", () =>
    rejected("step/1.1-x", "tests/security/probe.test.ts"));
  it("step/ touching .github fails", () =>
    rejected("step/1.1-x", ".github/workflows/ci.yml"));
  it("redteam/ touching src fails", () =>
    rejected("redteam/phase-1", "src/app/page.tsx"));
  it("kit/ touching .claude passes", () =>
    allowed("kit/x", ".claude/settings.json"));
  it("kit/ touching src fails", () => rejected("kit/x", "src/app/page.tsx"));
  it("an unknown prefix fails", () => {
    rejected("dependabot/npm/next", "package.json");
    rejected("main", "README.md");
    rejected("Step/1.1-x", "README.md");
  });

  it("step/ may change app code, unit tests, docs and package.json", () =>
    allowed(
      "step/1.1-x",
      "src/app/page.tsx",
      "tests/unit/a.test.ts",
      "docs/specs/1.1.md",
      "package.json",
    ));
  it("step/ fails on each protected place, in any case", () => {
    for (const file of [
      ".claude/settings.json",
      "docs/adr/0001-database-access.md",
      "CLAUDE.md",
      ".Claude/settings.json",
      "Docs/ADR/new.md",
      ".GitHub/workflows/ci.yml",
      "src/claude.md",
      // A symlink or submodule shows up as the folder's own name.
      "tests/security",
    ])
      rejected("step/1.1-x", file);
  });
  it("redteam/ may change security tests and gate reports only", () => {
    allowed(
      "redteam/phase-1",
      "tests/security/probe.test.ts",
      "docs/gates/phase-1-redteam.md",
    );
    rejected("redteam/phase-1", "tests/unit/a.test.ts");
    rejected("redteam/phase-1", "tests/security-notes.md");
  });
  it("kit/ fails on anything under tests/, in any case", () => {
    rejected("kit/x", "tests/unit/a.test.ts");
    rejected("kit/x", "Src/a.ts");
  });
  it("gives one message per violation", () => {
    const files = ["src/a.ts", "README.md", "tests/b.ts"];
    assert.equal(checkPaths("kit/x", files).length, 2);
  });
});

describe("acceptance test 2: pinned scripts", () => {
  const violations = (pkg, pinned, ...names) => {
    const messages = checkScripts(pkg, pinned);
    assert.equal(messages.length, names.length, messages.join("\n"));
    names.forEach((name, i) =>
      assert.ok(messages[i].includes(`"${name}"`), messages[i]),
    );
  };

  it("passes when check and the scripts it calls match their pins", () =>
    violations(packageJson(), PINNED));
  it("a changed scripts.check fails", () =>
    violations(packageJson({ check: "pnpm typecheck" }), PINNED, "check"));
  it("a changed lint fails", () =>
    violations(packageJson({ lint: "eslint --quiet" }), PINNED, "lint"));
  it("check calls a script that isn't pinned, and it fails", () => {
    const check = `${SCRIPTS.check} && pnpm knip`;
    const pinned = PINNED.replace(SCRIPTS.check, check);
    violations(packageJson({ check, knip: "knip" }), pinned, "knip");
  });
  it("a pinned script changed to `true` fails", () =>
    violations(packageJson({ typecheck: "true" }), PINNED, "typecheck"));

  it("check itself must be pinned", () =>
    violations(packageJson(), PINNED.replace(/^check: .*\n/, ""), "check"));
  it("a script that check calls must exist", () =>
    violations(packageJson({ lint: undefined }), PINNED, "lint"));
  it("package.json without check fails", () =>
    violations(packageJson({ check: undefined }), PINNED, "check"));
  it("a pin line it cannot read fails", () => {
    const messages = checkScripts(packageJson(), `${PINNED}lint=eslint\n`);
    assert.equal(messages.length, 1, messages.join("\n"));
  });
  it("a script pinned twice fails", () =>
    violations(packageJson(), `${PINNED}lint: true\n`, "lint"));
  it("a precheck script fails", () =>
    violations(packageJson({ precheck: "true" }), PINNED, "precheck"));
  it("a postlint script fails", () =>
    violations(packageJson({ postlint: "true" }), PINNED, "postlint"));
  it("a script that only looks like one of those passes", () =>
    violations(
      packageJson({ predev: "true", prepare: "true", "lint:post": "true" }),
      PINNED,
    ));
  it("the repository's package.json matches .github/check-script.txt", () => {
    const read = (file) => readFileSync(new URL(file, REPO_ROOT), "utf8");
    violations(read("package.json"), read(".github/check-script.txt"));
  });
});

describe("acceptance test 3: pull requests in throwaway repos", () => {
  const kitChange = () =>
    pullRequest("kit/x", adds(".claude/settings.json", "docs/note.md"));

  it("a PR from this repository that keeps the rules passes", () => {
    passes(runGuard(kitChange()));
    passes(runGuard(pullRequest("step/1.1-x", adds("src/a.ts"))));
  });
  it("a PR from a fork fails", () =>
    fails(
      runGuard(kitChange(), { headRepo: "someone/fork" }),
      /another repository/,
    ));
  it("a PR whose head repo is gone fails", () =>
    fails(
      runGuard(kitChange(), { headRepo: null }),
      /head repository is missing/,
    ));

  it("git mv out of tests/security/ fails on step/", () => {
    const pr = pullRequest(
      "step/1.1-x",
      (repo) => {
        repo.write("tests/unit/keep.ts");
        repo.git("mv", "tests/security/a.ts", "tests/unit/a.ts");
      },
      { "tests/security/a.ts": "export const probe = 1;\n" },
    );
    fails(runGuard(pr), /"tests\/security\/a\.ts"/);
  });
  it("a non-ASCII name under tests/security/ fails on step/", () => {
    const pr = pullRequest("step/1.1-x", adds("tests/security/é.ts"));
    fails(runGuard(pr), /"tests\/security\//);
  });
  for (const branch of ["step/1.1-x", "redteam/phase-1"]) {
    it(`Tests/Security/x.ts fails on ${branch}`, () => {
      const pr = pullRequest(branch, adds("Tests/Security/x.ts"));
      fails(runGuard(pr), /"Tests\/Security\/x\.ts"/);
    });
  }
  for (const file of [
    "src/features/x/CLAUDE.md",
    "docs/CLAUDE.local.md",
    ".mcp.json",
    "src/.mcp.json",
  ]) {
    it(`${file} fails on step/`, () => {
      const result = runGuard(pullRequest("step/1.1-x", adds(file)));
      fails(result, /may not change/);
      assert.ok(result.output.includes(`"${file}"`), result.output);
    });
  }

  it("a push checks only the pinned scripts", () => {
    // HEAD is a plain commit that changes tests/security/: no path rule applies.
    const repo = makeRepo({ "tests/security/a.ts": "x\n" });
    passes(runGuard({ repo }, { event: "push" }));
    repo.write("package.json", packageJson({ lint: "true" }));
    repo.commit("weaken lint");
    fails(runGuard({ repo }, { event: "push" }), /"lint" differs/);
  });
  it("a PR checks the pinned scripts too", () => {
    const pr = pullRequest("kit/x", (repo) =>
      repo.write("package.json", packageJson({ lint: "true" })),
    );
    fails(runGuard(pr), /"lint" differs/);
  });

  it("a merge commit of another head fails", () => {
    const pr = pullRequest("kit/x", adds("docs/note.md"));
    fails(
      runGuard({ ...pr, head: "0".repeat(40) }),
      /not the merge commit of the pull request/,
    );
  });
  it("a HEAD that is not a merge commit fails", () => {
    const pr = pullRequest("kit/x", adds("docs/note.md"));
    pr.repo.git("switch", "-q", "kit/x");
    fails(runGuard(pr), /not the merge commit of the pull request/);
  });
  it("an empty list of changes fails", () =>
    fails(runGuard(pullRequest("kit/x", () => {})), /no changed file/));
  it("fails when git fails", () => {
    const dir = mkdtempSync(path.join(tmp, "no-git-"));
    writeFileSync(path.join(dir, "package.json"), packageJson());
    mkdirSync(path.join(dir, ".github"));
    writeFileSync(path.join(dir, ".github/check-script.txt"), PINNED);
    const pr = { repo: { dir }, branch: "kit/x", head: "0".repeat(40) };
    fails(runGuard(pr), /not a git repository/);
  });
  it("an event it has no rules for fails", () =>
    fails(
      runGuard(kitChange(), { event: "workflow_dispatch" }),
      /no rules for the event/,
    ));

  it("a branch that merged main lists only its own changes", () => {
    const repo = makeRepo();
    repo.git("switch", "-q", "-c", "step/1.1-x");
    repo.write("src/a.ts");
    repo.commit("own change");
    repo.git("switch", "-q", "main");
    repo.write("tests/security/probe.ts");
    repo.commit("a red-team test lands on main");
    repo.git("switch", "-q", "step/1.1-x");
    repo.git("merge", "-q", "--no-edit", "main");
    const head = mergeCommit(repo, "step/1.1-x");
    passes(runGuard({ repo, branch: "step/1.1-x", head }));
  });
  it(".gitmodules cannot hide a changed submodule", () => {
    const repo = makeRepo();
    // An index entry only, so `git add -A` must not run after this.
    const submodule = (sha) =>
      repo.git(
        "update-index",
        "--add",
        "--cacheinfo",
        `160000,${sha},tests/security`,
      );
    repo.write(
      ".gitmodules",
      '[submodule "x"]\n\tpath = tests/security\n\turl = ./x\n\tignore = all\n',
    );
    repo.git("add", ".gitmodules");
    submodule(repo.git("rev-parse", "HEAD"));
    repo.git("commit", "-q", "-m", "a submodule on main");
    repo.git("switch", "-q", "-c", "step/1.1-x");
    submodule(repo.git("rev-parse", "HEAD"));
    repo.git("commit", "-q", "-m", "move the submodule");
    const head = mergeCommit(repo, "step/1.1-x");
    fails(runGuard({ repo, branch: "step/1.1-x", head }), /"tests\/security"/);
  });
});

// Decision 1 of the spec, read from the workflow's text: no YAML parser, since
// there are no dependencies. A form it cannot read counts as a violation.
function checkWorkflow(text) {
  const errors = [];
  const lines = text.split("\n");
  const isContent = (line) => !/^\s*(#.*)?$/.test(line);
  const indent = (line) => line.search(/\S|$/);
  // The lines below line `i` that are nested deeper than `column`.
  const nested = (i, column = indent(lines[i])) => {
    const rest = lines.slice(i + 1);
    const end = rest.findIndex((l) => isContent(l) && indent(l) <= column);
    return end === -1 ? rest : rest.slice(0, end);
  };
  const linesWith = (pattern) =>
    lines.flatMap((l, i) => (isContent(l) && pattern.test(l) ? [i] : []));

  if (text.includes("pull_request_target"))
    errors.push("pull_request_target is used");

  const [first, ...more] = linesWith(/permissions["']?\s*:/);
  if (
    more.length > 0 ||
    lines[first] !== "permissions:" ||
    nested(first).filter(isContent).join("\n") !== "  contents: read"
  )
    errors.push("permissions is not exactly `contents: read` at the top");

  const uses = linesWith(/\buses["']?\s*:/);
  if (uses.length === 0) errors.push("no uses: found");
  for (const i of uses) {
    const pinned =
      /^ *(- )?uses: [\w.-]+\/[\w./-]+@[0-9a-f]{40} # v\d+\.\d+\.\d+$/;
    if (!pinned.test(lines[i]))
      errors.push(`not pinned to a commit with its tag: ${lines[i].trim()}`);
  }

  const images = text.match(/\S*\/gitleaks(?![\w.-])\S*/g) ?? [];
  const byDigest = /^ghcr\.io\/gitleaks\/gitleaks:v[\d.]+@sha256:[0-9a-f]{64}$/;
  if (images.length === 0 || !images.every((image) => byDigest.test(image)))
    errors.push("the gitleaks image is not pinned by digest");

  // --text: a .gitattributes `-diff` or `binary` cannot hide a file. --log-opts
  // replaces gitleaks' own `--full-history --all`, so those must be there too.
  const logOpts = /--log-opts="--full-history --all --text"/;
  if (linesWith(logOpts).length === 0)
    errors.push("the gitleaks scan does not read the whole history as text");

  if (/\bsecrets\s*[.[]|\(\s*secrets\s*\)|\bsecrets: *inherit/i.test(text))
    errors.push("the secrets context is used");

  // A newer push cancels the older run of a pull request, never one on main.
  const cancel = linesWith(/cancel-in-progress["']?\s*:/);
  const onlyPulls =
    "  cancel-in-progress: ${{ github.event_name == 'pull_request' }}";
  if (cancel.length !== 1 || lines[cancel[0]] !== onlyPulls)
    errors.push("cancel-in-progress is not limited to pull requests");

  const jobs = [];
  const start = lines.indexOf("jobs:");
  if (start !== -1) {
    nested(start).forEach((line, offset) => {
      if (!isContent(line) || indent(line) !== 2) return;
      const name = /^ {2}([\w-]+):$/.exec(line)?.[1];
      if (!name) return errors.push(`unreadable job: ${line.trim()}`);
      jobs.push(name);
      const body = nested(start + 1 + offset);
      if (!body.some((l) => /^ {4}timeout-minutes: \d+$/.test(l)))
        errors.push(`job ${name} has no timeout`);
    });
  }
  if (jobs.length === 0) errors.push("no job found");

  for (const i of linesWith(/\brun["']?\s*:/)) {
    const key = /^ *(- )?(?=run:)/.exec(lines[i]);
    if (!key) {
      errors.push(`unreadable run: ${lines[i].trim()}`);
      continue;
    }
    const script = [lines[i], ...nested(i, key[0].length)].join("\n");
    if (script.includes("${{"))
      errors.push(`\${{ inside a run: ${lines[i].trim()}`);
  }

  return { errors, jobs };
}

describe("acceptance test 4: ci.yml keeps decision 1", () => {
  const workflow = () =>
    readFileSync(new URL(".github/workflows/ci.yml", REPO_ROOT), "utf8");

  it("has no violation", () => {
    assert.deepEqual(checkWorkflow(workflow()).errors, []);
  });
  it("is read job by job", () => {
    assert.deepEqual(checkWorkflow(workflow()).jobs, [
      "guard",
      "check",
      "e2e",
      "integration",
      "audit",
      "secrets",
      "ci-ok",
    ]);
  });

  // Each edit breaks one rule of the real workflow, so the check must object.
  const breaks = {
    "a pull_request_target trigger": [/^on:$/m, "on:\n  pull_request_target:"],
    "a write permission": [/^ {2}contents: read$/m, "  contents: write"],
    "a second permission": [
      /^ {2}contents: read$/m,
      "  contents: read\n# and\n  packages: write",
    ],
    "a job's own permissions": [
      /^ {2}guard:$/m,
      "  guard:\n    permissions: write-all",
    ],
    "an action pinned to a tag": [/@[0-9a-f]{40}/, "@v7"],
    "a pin without its tag comment": [/ # v\d+\.\d+\.\d+$/m, ""],
    "a gitleaks image without a digest": [/@sha256:[0-9a-f]{64}/, ""],
    "a scan without --text": [/ --text"/, '"'],
    "a scan of one branch only": [/ --all --text"/, ' --text"'],
    "a secret": [/^env:$/m, "env:\n  TOKEN: ${{ secrets.TOKEN }}"],
    "a secret by index": [/^env:$/m, "env:\n  TOKEN: ${{ secrets['T'] }}"],
    "a job without a timeout": [/^ {4}timeout-minutes: \d+\n/m, ""],
    "cancelling runs on main": [
      /cancel-in-progress: .*$/m,
      "cancel-in-progress: true",
    ],
    "a job that cancels runs": [
      /^ {2}guard:$/m,
      "  guard:\n    concurrency:\n      group: g\n      cancel-in-progress: true",
    ],
    "an expression in a one-line run": [
      /run: pnpm check$/m,
      "run: echo ${{ github.head_ref }}",
    ],
    "an expression in a block run": [
      /run: \|\n/,
      "run: |\n          # ${{ github.head_ref }}\n",
    ],
    "an expression on a run's second line": [
      /run: pnpm check$/m,
      "run: pnpm check\n          ${{ github.head_ref }}",
    ],
  };
  for (const [name, [pattern, replacement]] of Object.entries(breaks)) {
    it(`rejects ${name}`, () => {
      const text = workflow();
      const broken = text.replace(pattern, () => replacement);
      assert.notEqual(broken, text, "the edit did not apply");
      assert.notDeepEqual(checkWorkflow(broken).errors, []);
    });
  }
});

describe("acceptance test 4: a secret scan that read nothing fails", () => {
  // The script of the step that runs gitleaks, as Actions hands it to bash.
  function scanScript() {
    const text = readFileSync(
      new URL(".github/workflows/ci.yml", REPO_ROOT),
      "utf8",
    );
    const runs = text.matchAll(/^ {8}run: (\||>-)\n((?: {10}.*\n)+)/gm);
    for (const [, style, body] of runs) {
      if (!body.includes("/gitleaks:")) continue;
      const script = body.replace(/^ {10}/gm, "");
      return style === "|" ? script : script.trim().replaceAll("\n", " ");
    }
    assert.fail("no run: block runs gitleaks");
  }

  // Runs that script with a stand-in docker, which logs `log` and exits `status`.
  function scan(log, status = 0) {
    const dir = mkdtempSync(path.join(tmp, "scan-"));
    writeFileSync(
      path.join(dir, "docker"),
      '#!/bin/sh\nprintf \'%s\\n\' "$FAKE_LOG" >&2\nexit "$FAKE_STATUS"\n',
      { mode: 0o755 },
    );
    const result = spawnSync("bash", ["-e", "-c", scanScript()], {
      cwd: dir,
      env: {
        ...ENV,
        PATH: `${dir}${path.delimiter}${ENV.PATH}`,
        GITHUB_WORKSPACE: dir,
        RUNNER_TEMP: dir,
        FAKE_LOG: log,
        FAKE_STATUS: String(status),
      },
      encoding: "utf8",
    });
    const output = `${result.stdout}${result.stderr}`;
    // A reader of the CI log must see what gitleaks said.
    assert.ok(output.includes(log), output);
    return { status: result.status, output };
  }

  // gitleaks 8.30.1 with --no-color.
  const logged = (...messages) =>
    messages.map((message) => `3:04PM INF ${message}`).join("\n");
  const scanned = (commits) =>
    logged(`${commits} commits scanned.`, "no leaks found");

  for (const commits of [1, 10, 205]) {
    it(`passes when ${commits} were scanned and no key was found`, () =>
      passes(scan(scanned(commits))));
  }
  it("fails when 0 commits were scanned", () =>
    fails(scan(scanned(0)), /did not report a scanned commit/));
  it("fails when the commits line is missing", () =>
    fails(scan(logged("no leaks found")), /did not report a scanned commit/));
  it("fails when the commits line has another form", () =>
    fails(
      scan(logged("commits scanned: 31")),
      /did not report a scanned commit/,
    ));
  it("fails when gitleaks fails, whatever it scanned", () =>
    fails(scan(scanned(31), 1)));
});
