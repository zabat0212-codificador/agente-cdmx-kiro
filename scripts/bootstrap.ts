import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { copyTreeNoOverwrite, ensureDir, writeIfAbsent } from "./lib/fsx.js";
import { git } from "./lib/git.js";
import { mergeGitignore } from "./lib/gitignore.js";
import { needsGitkeep } from "./lib/gitkeep.js";
import { formatReport } from "./lib/report.js";
import { CONTRACT_TS, STEERING_ES } from "./lib/templates.js";
import {
  DEFAULT_BRANCH,
  DEFAULT_ECC_SOURCE,
  DEFAULT_REMOTE_URL,
  ECC_COPY_DIRS,
  REQUIRED_DIRS,
  REQUIRED_GITIGNORE,
  ROLE_FOLDERS,
  type BootstrapOptions,
  type StepResult,
} from "./lib/types.js";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Runs a step body and converts any thrown exception into a `failed` result. */
function runStep(step: string, body: () => StepResult): StepResult {
  try {
    return body();
  } catch (err) {
    return { step, status: "failed", detail: errorMessage(err) };
  }
}

function writeFileStep(
  step: string,
  opts: BootstrapOptions,
  relPath: string,
  content: string,
): StepResult {
  return runStep(step, () => {
    const written = writeIfAbsent(join(opts.root, relPath), content);
    return written
      ? { step, status: "succeeded", detail: `created ${relPath}` }
      : { step, status: "skipped", detail: `${relPath} already exists` };
  });
}

export function createDirectories(opts: BootstrapOptions): StepResult {
  const step = "create-directories";
  return runStep(step, () => {
    for (const dir of REQUIRED_DIRS) ensureDir(join(opts.root, dir));
    return { step, status: "succeeded", detail: REQUIRED_DIRS.join(", ") };
  });
}

export function writeGitignore(opts: BootstrapOptions): StepResult {
  const step = "write-gitignore";
  return runStep(step, () => {
    const path = join(opts.root, ".gitignore");
    const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
    const merged = mergeGitignore(existing, REQUIRED_GITIGNORE);
    if (merged === existing && existsSync(path)) {
      return { step, status: "skipped", detail: ".gitignore already has all required entries" };
    }
    writeFileSync(path, merged);
    return {
      step,
      status: "succeeded",
      detail: existsSync(path) && existing ? "merged required entries" : "created .gitignore",
    };
  });
}

export function writeSteering(opts: BootstrapOptions): StepResult {
  return writeFileStep(
    "write-steering",
    opts,
    ".kiro/steering/protocolo-equipo.md",
    STEERING_ES,
  );
}

export function writeContract(opts: BootstrapOptions): StepResult {
  return writeFileStep("write-contract", opts, "src/types/contract.ts", CONTRACT_TS);
}

export function placeGitkeeps(opts: BootstrapOptions): StepResult {
  const step = "place-gitkeeps";
  return runStep(step, () => {
    const added: string[] = [];
    const removed: string[] = [];
    for (const folder of ROLE_FOLDERS) {
      const dir = join(opts.root, folder);
      ensureDir(dir);
      const keep = join(dir, ".gitkeep");
      if (needsGitkeep(readdirSync(dir))) {
        if (writeIfAbsent(keep, "")) added.push(folder);
      } else if (existsSync(keep)) {
        rmSync(keep);
        removed.push(folder);
      }
    }
    if (added.length === 0 && removed.length === 0) {
      return { step, status: "skipped", detail: "no .gitkeep changes needed" };
    }
    const parts: string[] = [];
    if (added.length) parts.push(`added: ${added.join(", ")}`);
    if (removed.length) parts.push(`removed: ${removed.join(", ")}`);
    return { step, status: "succeeded", detail: parts.join("; ") };
  });
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function looksLikeRemote(source: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(source) || /^[\w.-]+@[\w.-]+:/.test(source);
}

/**
 * Copies `.kiro/skills` and `.kiro/agents` from the ECC source into the same
 * paths of the project, without overwriting. Never throws.
 */
export function copyEcc(opts: BootstrapOptions): StepResult {
  const step = "copy-ecc";
  let tmp: string | undefined;
  try {
    let srcRoot: string;
    if (isDirectory(opts.eccSource)) {
      srcRoot = opts.eccSource;
    } else if (looksLikeRemote(opts.eccSource)) {
      tmp = mkdtempSync(join(tmpdir(), "ecc-"));
      const clone = git(tmp, ["clone", "--depth", "1", opts.eccSource, join(tmp, "repo")]);
      if (!clone.ok) {
        return { step, status: "failed", detail: `git clone failed: ${clone.stderr.trim()}` };
      }
      srcRoot = join(tmp, "repo");
    } else {
      return { step, status: "failed", detail: `ECC source not found: ${opts.eccSource}` };
    }

    const copied: string[] = [];
    const kept: string[] = [];
    const found: string[] = [];
    for (const rel of ECC_COPY_DIRS) {
      const from = join(srcRoot, rel);
      if (!isDirectory(from)) continue;
      found.push(rel);
      const res = copyTreeNoOverwrite(from, join(opts.root, rel));
      copied.push(...res.copied.map((f) => `${rel}/${f}`));
      kept.push(...res.kept.map((f) => `${rel}/${f}`));
    }
    if (found.length === 0) {
      return {
        step,
        status: "failed",
        detail: `none of ${ECC_COPY_DIRS.join(", ")} found in ${opts.eccSource}`,
      };
    }
    return {
      step,
      status: "succeeded",
      detail: `copied ${copied.length} file(s), kept ${kept.length} existing, from ${found.join(", ")}`,
    };
  } catch (err) {
    return { step, status: "failed", detail: errorMessage(err) };
  } finally {
    if (tmp) {
      try {
        rmSync(tmp, { recursive: true, force: true });
      } catch {
        /* best effort cleanup */
      }
    }
  }
}

export const COMMIT_MESSAGE = "chore: instalar skills de ECC y estructura base para 4 roles";

/**
 * Initializes the repo (only when `.git` is absent), commits staged changes and,
 * when `remoteUrl` is set, points `origin` at it and pushes `main`.
 * A push failure keeps the local commit and reports the manual command.
 */
export function gitInitCommitPush(opts: BootstrapOptions): StepResult {
  const step = "git-init-commit-push";
  return runStep(step, () => {
    const notes: string[] = [];
    const fail = (msg: string): StepResult => ({
      step,
      status: "failed",
      detail: [...notes, msg].join("; "),
    });

    if (existsSync(join(opts.root, ".git"))) {
      notes.push("repository already exists");
    } else {
      const init = git(opts.root, ["init", "-b", DEFAULT_BRANCH]);
      if (!init.ok) return fail(`git init failed: ${init.stderr.trim()}`);
      notes.push(`initialized repository on ${DEFAULT_BRANCH}`);
    }

    const add = git(opts.root, ["add", "-A"]);
    if (!add.ok) return fail(`git add failed: ${add.stderr.trim()}`);

    // `diff --cached --quiet` exits 0 when nothing is staged.
    const nothingStaged = git(opts.root, ["diff", "--cached", "--quiet"]).ok;
    if (nothingStaged) {
      notes.push("nothing to commit");
    } else {
      const commit = git(opts.root, ["commit", "-m", COMMIT_MESSAGE]);
      if (!commit.ok) return fail(`git commit failed: ${commit.stderr.trim()}`);
      notes.push("committed");
    }

    if (!opts.remoteUrl) {
      notes.push("push skipped: no remote URL provided");
      return { step, status: "skipped", detail: notes.join("; ") };
    }

    const hasOrigin = git(opts.root, ["remote", "get-url", "origin"]).ok;
    const remote = git(
      opts.root,
      hasOrigin
        ? ["remote", "set-url", "origin", opts.remoteUrl]
        : ["remote", "add", "origin", opts.remoteUrl],
    );
    if (!remote.ok) return fail(`git remote failed: ${remote.stderr.trim()}`);

    const manual = `git push -u origin ${DEFAULT_BRANCH}`;
    const push = git(opts.root, ["push", "-u", "origin", DEFAULT_BRANCH]);
    if (!push.ok) {
      return fail(`push failed, local commit kept. Run manually: ${manual}. ${push.stderr.trim()}`);
    }
    notes.push(`pushed to ${opts.remoteUrl}`);
    return { step, status: "succeeded", detail: notes.join("; ") };
  });
}

/** Parses `--remote <url>`, `--no-remote` and `--ecc <path-or-url>`. */
export function parseArgs(argv: string[], root: string): BootstrapOptions {
  let eccSource = DEFAULT_ECC_SOURCE;
  let remoteUrl: string | undefined = DEFAULT_REMOTE_URL;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-remote") {
      remoteUrl = undefined;
    } else if (arg === "--remote" || arg === "--ecc") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      if (arg === "--remote") remoteUrl = value;
      else eccSource = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { root, eccSource, remoteUrl };
}

export function main(argv: string[] = process.argv.slice(2)): number {
  const opts = parseArgs(argv, process.cwd());
  const steps: Array<[string, (o: BootstrapOptions) => StepResult]> = [
    ["create-directories", createDirectories],
    ["write-gitignore", writeGitignore],
    ["write-steering", writeSteering],
    ["write-contract", writeContract],
    ["place-gitkeeps", placeGitkeeps],
    ["copy-ecc", copyEcc],
    ["git-init-commit-push", gitInitCommitPush],
  ];
  const results = steps.map(([name, fn]) => runStep(name, () => fn(opts)));
  console.log(formatReport(results));
  return 0;
}

const isDirectRun =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  try {
    process.exitCode = main();
  } catch (err) {
    console.error(errorMessage(err));
    process.exitCode = 1;
  }
}
