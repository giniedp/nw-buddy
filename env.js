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
const gameVersion = process.env.NW_GAME_VERSION

const config = {
  NW_MODELS_DIR: process.env.NW_MODELS_DIR,
  NW_GAME_VERSION: process.env.NW_GAME_VERSION || (isPtr ? 'PTR' : 'LIVE'),
  BRANCH_NAME: branchName,
  CDN_URL: process.env.CDN_URL,
  CDN_UPLOAD_SPACE: process.env.CDN_UPLOAD_SPACE,
  CDN_UPLOAD_KEY: process.env.CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET: process.env.CDN_UPLOAD_SECRET,
  CDN_UPLOAD_ENDPOINT: process.env.CDN_UPLOAD_ENDPOINT,
  PACKAGE_VERSION: packageVersion,
  COMMIT_HASH: commitHash,
  NW_WATERMARK: process.env.NW_WATERMARK,
}

function env(name) {
  const result = config[name] || process.env[name]
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
const dataDir = (workspace) => path.join('nw-data', getWorkspace(workspace).toLowerCase())

function getWorkspace(workspace) {
  if (typeof workspace === 'string') {
    return workspace.toUpperCase()
  }
  return workspace ? 'PTR' : 'LIVE'
}

const environment = {
  cwd: cwd,
  appsDir,
  distDir,
  libsDir,
  tmpDir,
  dataDir,
  nwGameDir: (workspace) => path.resolve(cwd, env(`NW_GAME_${getWorkspace(workspace)}`)),
  nwUnpackDir: (workspace) => path.resolve(cwd, env(`NW_UNPACK_${getWorkspace(workspace)}`)),
  nwConvertDir: (workspace) => tmpDir(dataDir(workspace)),
  nwDataDir: (workspace) => distDir(dataDir(workspace)),
  nwModelsDir: () => env('NW_MODELS_DIR'),
}

module.exports = {
  ...config,
  environment,
}
