import { S3, _Object } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import AdmZip from 'adm-zip'
import { Presets, SingleBar } from 'cli-progress'
import { program } from 'commander'
import { createHash } from 'crypto'
import fs from 'fs'
import { groupBy } from 'lodash'
import mime from 'mime-types'
import http from 'node:https'
import path from 'node:path'
import z from 'zod'
import {
  CDN_UPLOAD_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_UPLOAD_SPACE,
  CDN_URL,
  NW_WORKSPACE,
  environment,
  BRANCH_NAME,
} from '../env'
import { glob, writeJSONFile } from './utils'

// the SDK prefixes metadata keys with `x-amz-meta-` once more on write and strips it once on read
const HASH_META_KEY = 'x-amz-meta-file-hash'

interface UploadFile {
  file: string
  key: string
  contentType?: string
}

const config = {
  bucket: CDN_UPLOAD_SPACE,
  key: CDN_UPLOAD_KEY,
  secret: CDN_UPLOAD_SECRET,
  endpoint: CDN_UPLOAD_ENDPOINT,
}

program
  .command('download')
  .description('Downloads files from CDN to local workspace')
  .option('-v, --version <version>', 'Version name to download (default is the branch name)', BRANCH_NAME)
  .action(async (data) => {
    const options = z
      .object({
        version: z.string(),
      })
      .parse(data)

    const zipUrl = `${CDN_URL}/nw-data/${options.version}.zip?cache=${Date.now()}`
    const zipFile = environment.nwDataDir(options.version) + '.zip'
    const zipDir = path.dirname(zipFile)
    console.log(options)
    console.log('[DOWNLOAD]', zipUrl)

    if (!fs.existsSync(zipDir)) {
      console.log('Create dir', zipDir)
      fs.mkdirSync(zipDir, { recursive: true })
    }
    if (fs.existsSync(zipFile)) {
      console.log('Remove existing file', zipFile)
      fs.unlinkSync(zipFile)
    }

    console.log('Downloading to', zipFile)
    await download(zipUrl, zipFile)

    console.log('Unzipping to', zipDir)
    await unzip(zipFile, zipDir)
    // fs.unlinkSync(zipFile)

    const trash = path.join(zipDir, '__MACOSX')
    if (fs.existsSync(trash)) {
      fs.rmSync(trash, { recursive: true })
    }
  })

program
  .command('upload')
  .description('Zips nw-data folder (live or ptr) and uploads to CDN. Optionally uploads all files unzipped.')
  .option('-ws, --workspace <name>', 'workspace folder to upload (ptr or live)', NW_WORKSPACE)
  .option('-v, --version <version>', 'Version name to use for upload (default is the branch name)', BRANCH_NAME)
  .option('-f, --force', 'Uploads all files, instead of only new', false)
  .option('-dry, --dry-run', 'Dry run, does not upload files', false)
  .action(async (data) => {
    const options = z
      .object({
        force: z.boolean(),
        version: z.string(),
        workspace: z.string(),
        files: z.boolean(),
        dryRun: z.boolean(),
      })
      .parse(data)

    const zipDir = environment.nwDataDir(options.workspace)
    const zipFile = path.join(zipDir, '..', options.version + '.zip')
    const zipFileKey = normalizeKey(path.relative(environment.distDir(), zipFile))
    const client = createClient()

    const toUpload = [
      {
        file: zipFile,
        key: zipFileKey,
      },
    ]

    console.log('zip     ', zipDir, '->', zipFile)
    await createBundle(zipDir, zipFile)

    await glob(path.join(zipDir, '**', '*')).then((files) => {
      for (const file of files) {
        toUpload.push({
          file: file,
          key: normalizeKey(path.join('nw-data', options.version, path.relative(zipDir, file))),
        })
      }
    })

    await syncFiles({
      client: client,
      files: toUpload,
      source: zipDir,
      target: `nw-data/${options.version}`,
      dryRun: options.dryRun,
      force: options.force,
    })
  })

program
  .command('upload-models')
  .option('-f, --force', 'Uploads all files, instead of only new', false)
  .option('-d, --directory <dirPath>', 'The models directory to upload', './dist/nw-cdn/models')
  .option('-t, --target <outPath>', 'The target directory in the CDN', 'models')
  .option('-dry, --dry-run', 'Dry run, does not upload files', false)
  .action(async (opts) => {
    const options = z
      .object({
        force: z.boolean(),
        directory: z.string(),
        target: z.string(),
        dryRun: z.boolean(),
      })
      .parse(opts)

    const source = options.directory
    const target = options.target
    const files = await glob(path.join(source, '**/*')).then((list) => {
      return list.map((file) => {
        const extname = path.extname(file).toLowerCase()
        let contentType = 'application/octet-stream'
        if (extname == '.gltf') {
          contentType = 'model/gltf+json'
        } else if (extname == '.glb') {
          contentType = 'model/gltf-binary'
        }
        return {
          file: file,
          key: normalizeKey(path.join(target, path.relative(source, file))),
          contentType: contentType,
        }
      })
    })

    await syncFiles({
      client: createClient(),
      files: files,
      source: source,
      target: target,
      dryRun: options.dryRun,
      force: options.force,
    })
  })

program
  .command('upload-tiles')
  .description('Uploads the map tiles of a workspace to nw-data/<version>/lyshineui/worldtiles on the CDN')
  .option('-ws, --workspace <name>', 'workspace folder to read the tiles from (ptr or live)', NW_WORKSPACE)
  .option('-v, --version <version>', 'CDN folder below nw-data (default is the branch name)', BRANCH_NAME)
  .option('-m, --map <pattern>', 'glob of the map folders to upload, e.g. outpostrush or nw_dungeon_*', '*')
  .option('-f, --force', 'Uploads all files, instead of only new', false)
  .option('-dry, --dry-run', 'Dry run, does not upload files', false)
  .action(async (opts) => {
    const options = z
      .object({
        force: z.boolean(),
        workspace: z.string(),
        version: z.string().min(1),
        map: z.string(),
        dryRun: z.boolean(),
      })
      .parse(opts)

    const tilesPath = path.join('lyshineui', 'worldtiles')
    const tilesDir = path.join(environment.nwDataDir(options.workspace), tilesPath)
    const targetDir = path.join('nw-data', options.version, tilesPath)
    if (!fs.existsSync(tilesDir)) {
      throw new Error(`tiles folder does not exist: ${tilesDir}`)
    }

    const patterns = [path.join(tilesDir, options.map, '**/*.webp'), path.join(tilesDir, options.map, '**/*.png')]
    const imageFiles = await glob(patterns)
    const files = imageFiles.map((file) => {
      return {
        file: file,
        key: normalizeKey(path.join(targetDir, path.relative(tilesDir, file))),
      }
    })

    const groups = groupBy(imageFiles, (file) => path.dirname(file))
    for (const [dir, dirFiles] of Object.entries(groups)) {
      const indexFile = path.join(dir, 'tiles.json')
      const data = dirFiles.map((file) => path.basename(file))
      await writeJSONFile(data, {
        target: indexFile,
      })
      files.push({
        file: indexFile,
        key: normalizeKey(path.join(targetDir, path.relative(tilesDir, indexFile))),
      })
    }

    await syncFiles({
      client: createClient(),
      files: files,
      source: tilesDir,
      target: targetDir,
      dryRun: options.dryRun,
      force: options.force,
    })
  })

program.command('upload-character').action(async () => {
  const remoteDir = 'character'
  const sourceDir = 'tmp/character'
  const client = createClient()

  const patterns = [path.join(sourceDir, '**/*.webp'), path.join(sourceDir, '**/*.png')]
  const imageFiles = await glob(patterns)
  const files: UploadFile[] = imageFiles.map((file) => {
    return {
      file: file,
      key: normalizeKey(path.join(remoteDir, path.relative(sourceDir, file))),
    }
  })

  const groups = groupBy(imageFiles, (file) => path.dirname(file))
  for (const [dir, dirFiles] of Object.entries(groups)) {
    const indexFile = path.join(dir, 'tiles.json')
    const data = dirFiles.map((file) => path.basename(file))
    await writeJSONFile(data, {
      target: indexFile,
    })
    files.push({
      file: indexFile,
      key: normalizeKey(path.join(remoteDir, path.relative(sourceDir, indexFile))),
    })
  }

  await syncFiles({
    client: client,
    files: files,
    source: sourceDir,
    target: remoteDir,
  })
})

async function download(url: string, target: string, onProgress?: (downloaded: number, total: number) => void) {
  const file = fs.createWriteStream(target)

  return new Promise((resolve, reject) => {
    http.get(
      url,
      {
        headers: {
          'Cache-Control': 'no-cache',
        },
      },
      (response) => {
        const total = Number(response.headers['content-length'])
        let downloaded = 0
        response.on('data', (chunk) => {
          downloaded += chunk.length
          onProgress?.(downloaded, total)
        })
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(null)
        })
        file.on('error', (err) => {
          reject(err)
        })
      },
    )
  })
}

async function unzip(file: string, target: string) {
  return new Promise<void>((resolve, reject) => {
    new AdmZip(file).extractAllToAsync(target, true, false, (err) => {
      err ? reject(err) : resolve()
    })
  })
}

async function createBundle(dir: string, file: string) {
  const zip = new AdmZip()
  zip.addLocalFolder(dir, path.basename(dir), (file) => {
    if (file.startsWith('lyshineui')) {
      return false
    }
    return true
  })
  zip.writeZip(file)
}

/**
 * Compares the files with the objects below `target`, prints what changed and uploads it (unless `dryRun`).
 */
async function syncFiles({
  client,
  files,
  source,
  target,
  dryRun,
  force,
}: {
  client: S3
  files: UploadFile[]
  source: string
  target: string
  dryRun?: boolean
  force?: boolean
}) {
  console.log('source  ', path.resolve(source))
  console.log('target  ', `${config.bucket}/${normalizeKey(target)}`)
  console.log('local   ', files.length, 'files')

  let added = files
  let modified: UploadFile[] = []
  if (!force) {
    const changes = await compareFiles(client, files, target)
    added = changes.added
    modified = changes.modified
  }
  const toUpload = [...added, ...modified]
  console.log(
    'changes ',
    `${added.length} new, ${modified.length} modified, ${files.length - toUpload.length} unchanged`,
  )

  const listLimit = 20
  const listed = [...added.map((it) => `  new       ${it.key}`), ...modified.map((it) => `  modified  ${it.key}`)]
  for (const line of listed.slice(0, listLimit)) {
    console.log(line)
  }
  if (listed.length > listLimit) {
    console.log(`  ... and ${listed.length - listLimit} more`)
  }

  if (dryRun) {
    console.log('dry run, nothing uploaded')
    return
  }
  if (!toUpload.length) {
    return
  }
  await uploadFiles({ client, files: toUpload })
}

function createBar(label: string) {
  return new SingleBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: `${label.padEnd(8)} {bar} {percentage}% {value}/{total}{suffix}`,
    },
    Presets.shades_classic,
  )
}

async function uploadFiles({ client, files, parallel }: { client: S3; files: UploadFile[]; parallel?: number }) {
  const queue = [...files]
  const failures: Array<{ key: string; error: string }> = []
  let uploaded = 0

  const bar = createBar('upload')
  bar.start(files.length, 0, { suffix: '' })

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()
      try {
        await uploadWithRetry(client, item)
        uploaded++
      } catch (err) {
        failures.push({ key: item.key, error: formatError(err) })
      }
      bar.increment({ suffix: failures.length ? ` | ${failures.length} failed` : '' })
    }
  }

  const workerCount = Math.max(1, Math.min(parallel || 20, files.length))
  await Promise.all(Array.from({ length: workerCount }, worker))
  bar.stop()

  console.log('uploaded', uploaded, 'of', files.length, 'files')
  if (failures.length) {
    console.error(`failed   ${failures.length} files`)
    for (const failure of failures) {
      console.error(`  ${failure.key}: ${failure.error}`)
    }
    process.exitCode = 1
  }
}

async function uploadWithRetry(client: S3, item: UploadFile, attempts = 4) {
  const contentType = item.contentType || mime.lookup(path.basename(item.file)) || 'application/octet-stream'
  const hash = await fileHash(item.file, 'sha256')
  for (let attempt = 1; ; attempt++) {
    try {
      const upload = new Upload({
        params: {
          Bucket: config.bucket,
          Key: normalizeKey(item.key),
          Body: fs.createReadStream(item.file),
          ACL: 'public-read',
          ContentType: contentType,
          Metadata: {
            [HASH_META_KEY]: hash,
          },
        },
        client: client,
        queueSize: 3,
      })
      await upload.done()
      return
    } catch (err) {
      if (attempt >= attempts) {
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)))
    }
  }
}

function formatError(err: any) {
  const status = err?.$metadata?.httpStatusCode
  const body = typeof err?.body === 'string' ? err.body.trim() : ''
  return [status, err?.name, err?.message, body].filter((it) => !!it).join(' ')
}

/**
 * Splits the files into new and modified ones, listing the bucket once below `prefix`.
 * A different size means modified. Otherwise single part uploads have the MD5 of the content as ETag, multipart
 * uploads (ETag ends with `-<parts>`) are compared by the SHA-256 that uploadFiles stores in the object metadata.
 *
 * Expected to be slow for large folders: every file with the same size as its object is read and hashed
 * (the models folder is ~60 GB).
 */
async function compareFiles(client: S3, files: UploadFile[], prefix: string) {
  const objects = await listObjects(client, normalizeKey(prefix))
  console.log('remote  ', objects.size, 'objects')

  const queue = [...files]
  const added = new Set<UploadFile>()
  const modified = new Set<UploadFile>()

  async function isModified(item: UploadFile, object: _Object) {
    if (object.Size !== fs.statSync(item.file).size) {
      return true
    }
    const etag = object.ETag?.replace(/"/g, '') || ''
    if (!etag.includes('-')) {
      return etag !== (await fileHash(item.file, 'md5'))
    }
    const remoteHash = await client
      .headObject({ Bucket: config.bucket, Key: object.Key })
      .then((data) => data.Metadata?.[HASH_META_KEY])
      .catch(() => null)
    return remoteHash !== (await fileHash(item.file, 'sha256'))
  }

  const bar = createBar('compare')
  bar.start(files.length, 0, { suffix: '' })
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift()
      const object = objects.get(normalizeKey(item.key))
      if (!object) {
        added.add(item)
      } else if (await isModified(item, object)) {
        modified.add(item)
      }
      bar.increment()
    }
  }
  await Promise.all(Array.from({ length: Math.min(16, files.length) }, worker))
  bar.stop()

  return {
    added: files.filter((it) => added.has(it)),
    modified: files.filter((it) => modified.has(it)),
  }
}

/**
 * Lists all objects below `prefix`. The listing is split into the sub folders down to `depth` levels, which are
 * listed in parallel: a single listing returns at most 1000 objects per request.
 */
async function listObjects(client: S3, prefix: string, depth = 2) {
  const result = new Map<string, _Object>()
  const folders: string[] = []

  async function listPages(folderPrefix: string, delimiter?: string) {
    let token: string | undefined = undefined
    do {
      const data = await client.listObjectsV2({
        Bucket: config.bucket,
        Prefix: folderPrefix,
        Delimiter: delimiter,
        MaxKeys: 1000,
        ContinuationToken: token,
      })
      for (const object of data.Contents || []) {
        result.set(normalizeKey(object.Key), object)
      }
      for (const common of data.CommonPrefixes || []) {
        folders.push(common.Prefix)
      }
      token = data.IsTruncated ? data.NextContinuationToken : undefined
    } while (token)
  }

  let level = [prefix.endsWith('/') ? prefix : prefix + '/']
  for (let i = 0; i < depth; i++) {
    folders.length = 0
    await Promise.all(level.map((it) => listPages(it, '/')))
    level = [...folders]
  }
  const queue = [...level]
  async function worker() {
    while (queue.length > 0) {
      await listPages(queue.shift())
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker))

  return result
}

program.parse(process.argv)

function createClient() {
  return new S3({
    forcePathStyle: false,
    endpoint: config.endpoint,
    // Note, specifying us-east-1 does not result in slower performance, regardless of your Space’s location.
    // The SDK checks the region for verification purposes but never sends the payload there.
    // Instead, it sends the payload to the specified custom endpoint.
    region: 'us-east-1',
    credentials: {
      accessKeyId: config.key,
      secretAccessKey: config.secret,
    },
  })
}

function normalizeKey(key: string) {
  return key.replace(/\\/g, '/').toLowerCase()
}

async function fileHash(filePath: string, algorithm: 'sha256' | 'md5') {
  const hash = createHash(algorithm)
  hash.update((await fs.promises.readFile(filePath)) as any)
  return hash.digest('hex')
}
