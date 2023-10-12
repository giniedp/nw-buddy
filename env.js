require('dotenv').config()

function cmd(cmd) {
  const shell = require('shelljs')
  const result = shell.exec(cmd, { silent: true })
  if (result.code !== 0) {
    throw new Error('[git-rev-sync] failed to execute command: ' + result.stdout)
  }
  return result.stdout.toString('utf8').replace(/^\s+|\s+$/g, '')
}

const branchName =
  process.env.CF_PAGES_BRANCH || // Cloudflare Pages
  process.env.GITHUB_REF_NAME || // Github Actions
  process.env.CIRCLE_BRANCH || // CircleCI
  cmd('git branch --show-current')
const commitHash =
  process.env.CF_PAGES_COMMIT_SHA || // Cloudflare Pages
  process.env.GITHUB_SHA || // Github Actions
  process.env.CIRCLE_SHA1 // CircleCI
const isPtr = branchName === 'ptr' || branchName.startsWith('ptr-')
//const isCI = !!process.env.CI
const path = require('path')
const packageVersion = require(path.resolve(process.cwd(), 'package.json')).version
const config = {
  NW_GAME_LIVE: process.env.NW_GAME_LIVE,
  NW_GAME_PTR: process.env.NW_GAME_PTR,
  NW_UNPACK_LIVE: process.env.NW_UNPACK_LIVE,
  NW_UNPACK_PTR: process.env.NW_UNPACK_PTR,
  NW_MODELS_DIR: process.env.NW_MODELS_DIR,

  NW_USE_PTR: ['true', 'yes', '1'].includes(process.env.NW_USE_PTR ?? String(isPtr)),
  BRANCH_NAME: branchName,
  CDN_URL: process.env.CDN_URL,
  CDN_UPLOAD_SPACE: process.env.CDN_UPLOAD_SPACE,
  CDN_UPLOAD_KEY: process.env.CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET: process.env.CDN_UPLOAD_SECRET,
  CDN_UPLOAD_ENDPOINT: process.env.CDN_UPLOAD_ENDPOINT,
  PACKAGE_VERSION: packageVersion,
  COMMIT_HASH: commitHash,
}

function env(name) {
  const result = config[name]
  if (result == null) {
    throw new Error(`env variable '${name}' is not defined `)
  }
  return result
}

const cwd = process.cwd()
const appsDir = (...paths) => path.join(cwd, 'apps', ...paths)
const distDir = (...paths) => path.join(cwd, 'dist', ...paths)
const tmpDir = (...paths) => path.join(cwd, 'tmp', ...paths)
const libsDir = (...paths) => path.join(cwd, 'libs', ...paths)
const dataDir = (isPtr) => path.join('nw-data', isPtr ? 'ptr' : 'live')

const environment = {
  cwd: cwd,
  appsDir,
  distDir,
  libsDir,
  tmpDir,
  dataDir,
  nwGameDir: (isPtr) => path.resolve(cwd, env(isPtr ? 'NW_GAME_PTR' : 'NW_GAME_LIVE')),
  nwUnpackDir: (isPtr) => path.resolve(cwd, env(isPtr ? 'NW_UNPACK_PTR' : 'NW_UNPACK_LIVE')),
  nwConvertDir: (isPtr) => tmpDir(dataDir(isPtr)),
  nwDataDir: (isPtr) => distDir(dataDir(isPtr)),
  nwModelsDir: () => env('NW_MODELS_DIR'),
}

module.exports = {
  ...config,
  environment,
}
