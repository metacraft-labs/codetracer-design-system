// lane.mjs — shared pieces of the downstream lane: which repositories consume
// the tokens, where their checkouts are, and the git and process helpers the
// lane's gates (consumers.lane.mjs) are built from.
//
// The lane answers one question for a candidate revision of this repository:
// would each consumer still build its token outputs if it moved its pin to
// that revision? Every consumer pins a revision of this repository (a git
// submodule, a flake input), so its own CI looks at a token change only when
// someone bumps the pin. The lane looks before the change reaches `dev`.
//
// Everything here works on COMMITTED state: the candidate is a commit of this
// repository, and each consumer is the commit its checkout has checked out.
// Each gate runs in a scratch copy, so a consumer checkout is only read,
// never written, and uncommitted edits in it are not part of the measurement.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Root of this repository's checkout. */
export const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/**
 * The consumers the lane checks. `env` names the variable that points the
 * lane at a checkout; without it the lane uses the workspace sibling
 * `../<name>`, which is also where `.github/workflows/downstream.yml` clones
 * each one. `ref` is the branch that workflow's hand-moved commit pin for
 * the consumer is taken from: the repository's agent landing branch, where
 * the changes that move together with this repository's land (`dev` for a
 * repository that has no `agents`).
 */
export const CONSUMERS = [
  { name: 'codetracer', repo: 'metacraft-labs/codetracer', env: 'DS_DOWNSTREAM_CODETRACER', ref: 'agents' },
  { name: 'codetracer-ci', repo: 'metacraft-labs/codetracer-ci', env: 'DS_DOWNSTREAM_CODETRACER_CI', ref: 'agents' },
  { name: 'codetracer-web-site', repo: 'metacraft-labs/codetracer-web-site', env: 'DS_DOWNSTREAM_WEB_SITE', ref: 'dev' },
];

/** Names the candidate revision; `HEAD` of this checkout when unset. */
export const CANDIDATE_ENV = 'DS_DOWNSTREAM_CANDIDATE';

/** Looks up a consumer by name. */
export function consumer(name) {
  const c = CONSUMERS.find((x) => x.name === name);
  if (!c) throw new Error(`unknown consumer ${name}`);
  return c;
}

/** The checkout directory the lane reads a consumer from. */
export function consumerDir(c, env = process.env) {
  return env[c.env] ? resolve(env[c.env]) : join(dirname(root), c.name);
}

/**
 * Runs a command and returns its result without throwing. stdin is closed:
 * git hooks managed by the workspace tooling read stdin, and a command run
 * from a test must never wait on the terminal.
 */
export function run(cmd, args, { cwd, env } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
  if (r.error) {
    const why = r.error.code === 'ENOENT' ? `${cmd} is not on PATH` : r.error.message;
    throw new Error(`cannot run ${cmd}: ${why}`);
  }
  return { status: r.status, signal: r.signal, stdout: r.stdout, stderr: r.stderr };
}

/** The last `n` lines of a command's combined output, for a failure message. */
export function tail(result, n = 40) {
  const text = `${result.stdout ?? ''}${result.stderr ? `\n${result.stderr}` : ''}`.trimEnd();
  return text.split('\n').slice(-n).join('\n');
}

/** Runs git and returns its trimmed stdout; throws with git's stderr on failure. */
export function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(`git ${args.join(' ')} (in ${cwd}) failed: ${String(err.stderr || err.message).trim()}`);
  }
}

/**
 * Resolves the commit a consumer checkout has checked out. Throws a message
 * naming the remedy when the checkout is missing, so a lane without its
 * consumers fails rather than passing with nothing checked.
 */
export function consumerCommit(c, env = process.env) {
  const dir = consumerDir(c, env);
  if (!existsSync(dir)) {
    throw new Error(
      `${c.name}: no checkout at ${dir}. Clone ${c.repo} (branch ${c.ref}) there, ` +
      `or point ${c.env} at a checkout.`);
  }
  return { dir, sha: git(['rev-parse', '--verify', 'HEAD^{commit}'], dir) };
}

/**
 * Checks `sha` of the repository at `repoDir` out into `dest` without touching
 * `repoDir`. `--shared` borrows the source's objects, so nothing is copied but
 * the files checked out; `sparse` limits those to the listed directories (cone
 * mode, which also keeps every file at the top level and along each path).
 */
export function checkoutCommit(repoDir, sha, dest, { sparse } = {}) {
  git(['clone', '--quiet', '--shared', '--no-checkout', repoDir, dest], dirname(dest));
  if (sparse) git(['sparse-checkout', 'set', '--cone', ...sparse], dest);
  git(['checkout', '--quiet', '--detach', sha], dest);
  return dest;
}

/**
 * The variable names a generated stylus file defines: every line of the form
 * `name = value`, which is how codetracer's `scripts/tokens-to-styl.sh` writes
 * a token. Comments and blank lines define nothing.
 */
export function definedStylVariables(text) {
  const names = new Set();
  for (const m of text.matchAll(/^([A-Za-z_][\w-]*)[ \t]*=/gm)) names.add(m[1]);
  return names;
}

/** Names in `before` that `after` no longer defines, sorted. */
export function removedVariables(before, after) {
  return [...before].filter((n) => !after.has(n)).sort();
}
