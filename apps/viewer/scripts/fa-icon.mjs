// Copies Font Awesome Pro icons into src/ui/icons, the single icon source of the UI (see src/ui/README.md).
//
//   pnpm icon <name...> [--style sharp-light] [--force]   copy icons, e.g. `pnpm icon folder folder-open file`
//   pnpm icon --search <text> [--style ..]                list icon names containing <text>
//   pnpm icon --styles                                    list the available styles
//   pnpm icon --check                                     check src/ui/icons and the icon imports
//
// Existing files are never overwritten without --force: they may have been replaced by hand.
// Icons must color through fill="currentColor"; files with other colors are refused.
//
// The Pro package (we have a license) is looked up in this order:
// - NW_FONTAWESOME_DIR: a folder that contains svgs-full/ (the root of @fortawesome/fontawesome-pro)
// - .fontawesome/ of this package (gitignored)
// - the copy installed by nw-odin (e:\nw-odin\ui\.fontawesome)
// If none exists, it is installed into .fontawesome/, which needs FONTAWESOME_NPM_AUTH_TOKEN
// (fontawesome.com > Account > Package Token) in the environment.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_STYLE = 'sharp-light'
// svgs-full: every icon on the same 640 x 640 grid, so icons line up in trees and tab strips
const SET = 'svgs-full'
const PACKAGE = '@fortawesome/fontawesome-pro@7'
const PACKAGE_PATH = path.join('node_modules', '@fortawesome', 'fontawesome-pro')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'src')
const target = path.join(src, 'ui', 'icons')
const cache = path.join(root, '.fontawesome')

function fail(message) {
  console.error(`icon: ${message}`)
  process.exit(1)
}

function packageCandidates() {
  return [
    process.env.NW_FONTAWESOME_DIR,
    path.join(cache, PACKAGE_PATH),
    path.resolve(root, '..', '..', '..', 'nw-odin', 'ui', '.fontawesome', PACKAGE_PATH),
  ].filter(Boolean)
}

function findPackage() {
  return packageCandidates().find((dir) => fs.existsSync(path.join(dir, SET)))
}

function installPackage() {
  if (!process.env.FONTAWESOME_NPM_AUTH_TOKEN) {
    fail(
      `the Pro package was not found (looked in ${packageCandidates().join(', ')}) and FONTAWESOME_NPM_AUTH_TOKEN ` +
        'is not set to install it. Copy the package token from fontawesome.com (Account > Package Token).',
    )
  }
  fs.mkdirSync(cache, { recursive: true })
  // npm expands ${...} in .npmrc, so the token itself is never written to disk here
  fs.writeFileSync(
    path.join(cache, '.npmrc'),
    '@fortawesome:registry=https://npm.fontawesome.com/\n//npm.fontawesome.com/:_authToken=${FONTAWESOME_NPM_AUTH_TOKEN}\n',
  )
  fs.writeFileSync(path.join(cache, 'package.json'), '{ "private": true }\n')
  console.error(`icon: installing ${PACKAGE} into ${cache} …`)
  try {
    execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund', PACKAGE], {
      cwd: cache,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
  } catch {
    fail('installing the Pro package failed. A 401 means the registry rejected FONTAWESOME_NPM_AUTH_TOKEN.')
  }
  return path.join(cache, PACKAGE_PATH)
}

/**
 * Problems of an icon file: it must color through currentColor only
 */
function svgProblems(text) {
  const problems = []
  if (!/fill="currentColor"/.test(text)) {
    problems.push('no fill="currentColor"')
  }
  for (const [, attr, value] of text.matchAll(/\b(fill|stroke|color|stop-color)="([^"]*)"/g)) {
    if (value !== 'currentColor' && value !== 'none') {
      problems.push(`${attr}="${value}"`)
    }
  }
  if (/\b(style|class)="/.test(text)) {
    problems.push('style or class attribute')
  }
  return problems
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(file, out)
    } else {
      out.push(file)
    }
  }
  return out
}

function rel(file) {
  return path.relative(root, file).replaceAll('\\', '/')
}

function check() {
  let errors = 0
  const report = (message) => {
    console.error(`icon: ${message}`)
    errors++
  }
  for (const file of fs.readdirSync(target)) {
    const full = path.join(target, file)
    if (!file.endsWith('.svg') || fs.statSync(full).isDirectory()) {
      report(`${rel(full)}: only flat .svg files belong in src/ui/icons`)
      continue
    }
    for (const problem of svgProblems(fs.readFileSync(full, 'utf8'))) {
      report(`${rel(full)}: ${problem}`)
    }
  }
  for (const file of walk(src)) {
    if (file.endsWith('.svg') && path.dirname(file) !== target) {
      report(`${rel(file)}: icon outside src/ui/icons`)
    }
    if (!/\.(ts|tsx)$/.test(file)) {
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    for (const [, spec] of text.matchAll(/from\s+['"]([^'"]+\.svg)(\?[^'"]*)?['"]/g)) {
      const resolved = path.resolve(path.dirname(file), spec)
      if (path.dirname(resolved) !== target) {
        report(`${rel(file)}: imports ${spec}, icons come from src/ui/icons only`)
      } else if (!fs.existsSync(resolved)) {
        report(`${rel(file)}: imports ${spec}, which does not exist`)
      }
    }
    if (/<svg[\s>]/.test(text)) {
      report(`${rel(file)}: svg markup in code, put the icon in src/ui/icons`)
    }
  }
  console.log(errors ? `icon: ${errors} problem(s)` : 'icon: ok')
  process.exit(errors ? 1 : 0)
}

const args = process.argv.slice(2)
let style = DEFAULT_STYLE
const names = []
let search
let listStyles = false
let force = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--style') style = args[++i]
  else if (args[i] === '--search') search = args[++i]
  else if (args[i] === '--styles') listStyles = true
  else if (args[i] === '--force') force = true
  else if (args[i] === '--check') check()
  else names.push(args[i].replace(/\.svg$/, ''))
}
if (!listStyles && search == null && names.length === 0) {
  fail('usage: pnpm icon <name...> [--style sharp-light] [--force] | --search <text> | --styles | --check')
}

const pkg = findPackage() ?? installPackage()
const set = path.join(pkg, SET)
const styles = () => fs.readdirSync(set).filter((d) => fs.statSync(path.join(set, d)).isDirectory())
if (listStyles) {
  console.log(styles().join('\n'))
  process.exit(0)
}
const dir = path.join(set, style)
if (!fs.existsSync(dir)) {
  fail(`unknown style "${style}", available: ${styles().join(', ')}`)
}
if (search != null) {
  const hits = fs.readdirSync(dir).filter((f) => f.includes(search))
  console.log(hits.map((f) => f.replace(/\.svg$/, '')).join('\n'))
  process.exit(0)
}

fs.mkdirSync(target, { recursive: true })
let failed = 0
for (const name of names) {
  const source = path.join(dir, `${name}.svg`)
  const dest = path.join(target, `${name}.svg`)
  if (!fs.existsSync(source)) {
    console.error(`icon: ${style}/${name} not found (try --search)`)
    failed++
    continue
  }
  if (fs.existsSync(dest) && !force) {
    console.log(`icon: skipped ${name}, ${rel(dest)} exists (--force replaces it)`)
    continue
  }
  const text = fs.readFileSync(source, 'utf8')
  const problems = svgProblems(text)
  if (problems.length) {
    console.error(`icon: refused ${style}/${name}: ${problems.join(', ')}`)
    failed++
    continue
  }
  fs.writeFileSync(dest, text)
  console.log(`icon: copied ${style}/${name} -> ${rel(dest)}`)
}
process.exit(failed ? 1 : 0)
