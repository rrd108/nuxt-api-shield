#!/usr/bin/env node
// Release nuxt-api-shield to npm.
//
//   yarn release            preflight, pick the bump from commits, run all checks, confirm, publish
//   yarn release --dry-run  everything up to (not including) the version bump
//   yarn release --major    force the bump type (--minor / --patch also work)
//   yarn release --yes      skip the final confirmation
//
// The bump is decided from the Conventional Commits since the last tag, the same way
// changelogen does it: a breaking change (`feat!:` or `BREAKING CHANGE:`) is major,
// `feat:` is minor, anything else is patch.

import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { readFileSync } from 'node:fs'
import {
  loadChangelogConfig,
  getLastGitTag,
  getGitDiff,
  parseCommits,
  determineSemverChange,
} from 'changelogen'

const REGISTRY = 'https://registry.npmjs.org/'
const BRANCH = 'main'
const NODE_MAJORS = [22, 24]
const BUMPS = ['patch', 'minor', 'major']

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run') || args.has('--dry')
const assumeYes = args.has('--yes') || args.has('-y')
const forcedBump = BUMPS.find(b => args.has(`--${b}`))

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const c = {
  red: s => `\x1B[31m${s}\x1B[0m`,
  green: s => `\x1B[32m${s}\x1B[0m`,
  yellow: s => `\x1B[33m${s}\x1B[0m`,
  bold: s => `\x1B[1m${s}\x1B[0m`,
  dim: s => `\x1B[2m${s}\x1B[0m`,
}

function capture(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', ...opts })
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() }
}

function run(label, cmd, cmdArgs, opts = {}) {
  console.log(`\n${c.bold('▶')} ${label} ${c.dim(`(${[cmd, ...cmdArgs].join(' ')})`)}`)
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', ...opts })
  if (r.status !== 0) {
    throw new Error(`${label} failed (exit ${r.status})`)
  }
}

function fail(msg) {
  console.error(`\n${c.red('❌')} ${msg}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 1. Preflight: environment, git, npm, GitHub. Collect every problem, then stop.
// ---------------------------------------------------------------------------

const problems = []
const ok = msg => console.log(`${c.green('✓')} ${msg}`)
const problem = msg => problems.push(msg)

console.log(c.bold(`\nReleasing ${pkg.name} (current ${pkg.version})${dryRun ? c.yellow(' [dry run]') : ''}\n`))

// Node
const nodeMajor = Number(process.versions.node.split('.')[0])
if (NODE_MAJORS.includes(nodeMajor)) ok(`Node.js v${process.versions.node}`)
else problem(`Node.js v${process.versions.node}: use v${NODE_MAJORS.join(' or v')}`)

// Git
const branch = capture('git', ['branch', '--show-current']).out
if (branch === BRANCH) ok(`Git branch ${BRANCH}`)
else problem(`Release must run on ${BRANCH} (current: ${branch || 'detached HEAD'})`)

const dirty = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).stdout.trimEnd()
if (!dirty) ok('Working tree clean')
else problem(`Working tree is not clean. Commit or stash first:\n${dirty.split('\n').map(l => `     ${l}`).join('\n')}`)

if (capture('git', ['fetch', '--tags', 'origin', BRANCH]).ok) {
  const behind = Number(capture('git', ['rev-list', '--count', `HEAD..origin/${BRANCH}`]).out || 0)
  if (behind === 0) ok(`Up to date with origin/${BRANCH}`)
  else problem(`${BRANCH} is ${behind} commit(s) behind origin/${BRANCH}. Run: git pull --rebase origin ${BRANCH}`)
}
else {
  problem('git fetch origin failed')
}

// npm: logged in, and allowed to publish this package
const whoami = capture('npm', ['whoami', '--registry', REGISTRY])
let npmUser = ''
if (whoami.ok && whoami.out) {
  npmUser = whoami.out
  ok(`npm logged in as ${npmUser}`)
}
else {
  problem(`Not logged in to npm (${whoami.err.split('\n')[0] || 'npm whoami failed'}). Check the token in .npmrc or run: npm login`)
}

if (npmUser) {
  const owners = capture('npm', ['owner', 'ls', pkg.name, '--registry', REGISTRY])
  if (!owners.ok) {
    problem(`Could not read npm owners of ${pkg.name}: ${owners.err.split('\n')[0]}`)
  }
  else if (owners.out.split('\n').some(line => line.split(' ')[0] === npmUser)) {
    ok(`${npmUser} is an npm owner of ${pkg.name}`)
  }
  else {
    problem(`${npmUser} is not an owner of ${pkg.name} on npm (owners: ${owners.out.replace(/\n/g, ', ')})`)
  }
}

// GitHub: token for the release created at the end
const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || capture('gh', ['auth', 'token']).out
if (ghToken) ok('GitHub token available for the release')
else problem('No GitHub token: run `gh auth login` or set GITHUB_TOKEN')

// ---------------------------------------------------------------------------
// 2. Decide the bump from the commits since the last tag.
// ---------------------------------------------------------------------------

const config = await loadChangelogConfig(process.cwd(), {})
const lastTag = await getLastGitTag()
const commits = parseCommits(await getGitDiff(lastTag), config)
  .filter(cm => !(cm.type === 'chore' && cm.scope === 'release'))
const detected = determineSemverChange(commits, config)

console.log(c.bold(`\nCommits since ${lastTag || 'the beginning'}:`))
if (commits.length === 0) console.log(c.dim('  (none)'))
for (const cm of commits) {
  const tag = cm.isBreaking ? c.red(' BREAKING') : ''
  console.log(`  ${c.dim(cm.shortHash)} ${cm.type}${cm.scope ? `(${cm.scope})` : ''}: ${cm.description}${tag}`)
}

let bump = forcedBump || detected
if (!bump) {
  problem('No releasable commits since the last tag (only non-semver types). Pass --patch to release anyway.')
}
else {
  // Same rule as changelogen: on 0.x a breaking change is a minor, a feature a patch
  let effective = bump
  if (pkg.version.startsWith('0.')) effective = bump === 'major' ? 'minor' : bump === 'minor' ? 'patch' : bump
  if (forcedBump && detected && BUMPS.indexOf(forcedBump) < BUMPS.indexOf(detected)) {
    console.log(c.yellow(`\n⚠ Forcing ${forcedBump}, but the commits call for ${detected}.`))
  }
  bump = effective
}

function inc(version, type) {
  const [major, minor, patch] = version.split('-')[0].split('.').map(Number)
  if (type === 'major') return `${major + 1}.0.0`
  if (type === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

const newVersion = bump ? inc(pkg.version, bump) : null
if (newVersion) {
  console.log(`\n${c.bold('Bump:')} ${bump}${forcedBump ? ' (forced)' : detected ? ' (from commits)' : ''}  ${pkg.version} → ${c.green(newVersion)}`)

  const published = capture('npm', ['view', `${pkg.name}@${newVersion}`, 'version', '--registry', REGISTRY])
  if (published.ok && published.out) problem(`${pkg.name}@${newVersion} is already on npm`)
  else ok(`${newVersion} is not yet on npm`)

  if (capture('git', ['rev-parse', '-q', '--verify', `refs/tags/v${newVersion}`]).ok) {
    problem(`Tag v${newVersion} already exists`)
  }
}

if (problems.length) {
  console.error(c.red(c.bold(`\n❌ Preflight failed (${problems.length}):`)))
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 3. Checks: lint, tests (incl. type tests), build, package contents.
// ---------------------------------------------------------------------------

try {
  run('Lint', 'yarn', ['lint'])
  run('Tests', 'yarn', ['test'])
  run('Build', 'yarn', ['prepack'])
  run('Package contents', 'npm', ['pack', '--dry-run', '--ignore-scripts'])
}
catch (e) {
  fail(e.message)
}

if (dryRun) {
  console.log(c.green(c.bold(`\n✓ Dry run passed. \`yarn release\` would publish ${pkg.name}@${newVersion} (${bump}).`)))
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 4. Confirm, then release: changelog + tag, publish, push, GitHub release.
// ---------------------------------------------------------------------------

if (!assumeYes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(c.bold(`\nPublish ${pkg.name}@${newVersion} to npm and push v${newVersion}? [y/N] `))
  rl.close()
  if (!/^y(?:es)?$/i.test(answer.trim())) fail('Aborted, nothing was changed.')
}

let step = 'changelog'
try {
  run('Changelog, version bump, commit and tag', 'yarn', ['changelogen', '--release', `--${bump}`, '--no-github'])
  const bumped = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version
  if (bumped !== newVersion) throw new Error(`changelogen bumped to ${bumped}, expected ${newVersion}`)

  step = 'publish'
  // prepack runs again here, so dist/module.json carries the new version
  run('Publish to npm', 'npm', ['publish', '--registry', REGISTRY])

  step = 'push'
  run('Push commit and tag', 'git', ['push', '--follow-tags', 'origin', BRANCH])

  step = 'github'
  run('GitHub release', 'yarn', ['changelogen', 'gh', 'release', `v${newVersion}`], {
    env: { ...process.env, GITHUB_TOKEN: ghToken },
  })
}
catch (e) {
  const recovery = {
    changelog: `Nothing published. Undo a partial bump with: git reset --hard origin/${BRANCH} && git tag -d v${newVersion}`,
    publish: `The release commit and tag v${newVersion} exist locally but nothing is on npm. Fix the problem and run: npm publish && git push --follow-tags && yarn changelogen gh release v${newVersion}\n   Or undo with: git reset --hard HEAD~1 && git tag -d v${newVersion}`,
    push: `${pkg.name}@${newVersion} IS on npm. Push by hand: git push --follow-tags origin ${BRANCH} && yarn changelogen gh release v${newVersion}`,
    github: `${pkg.name}@${newVersion} is published and pushed. Create the GitHub release with: yarn changelogen gh release v${newVersion}`,
  }
  fail(`${e.message}\n   ${recovery[step]}`)
}

console.log(c.green(c.bold(`\n🎉 Released ${pkg.name}@${newVersion}`)))
