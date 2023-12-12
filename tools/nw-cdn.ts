import { S3, _Object } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import * as AdmZip from 'adm-zip'
import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as http from 'https'
import * as mime from 'mime-types'
import * as path from 'path'
import z from 'zod'
import {
  CDN_UPLOAD_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_UPLOAD_SPACE,
  CDN_URL,
  NW_GAME_VERSION,
  environment,
} from '../env'
import { glob } from './utils/file-utils'

const config = {
  bucket: CDN_UPLOAD_SPACE,
  key: CDN_UPLOAD_KEY,
  secret: CDN_UPLOAD_SECRET,
  endpoint: CDN_UPLOAD_ENDPOINT,
}

program
  .command('download')
  .description('Downloads files from CDN to local workspace')
  .option('-ws, --workspace', 'ptr or live workspace into which to download data', NW_GAME_VERSION)
  .option('-v, --version <version>', 'Version name to download', path.basename(environment.nwDataDir(NW_GAME_VERSION)))
  .action(async (data) => {
    const options = z
      .object({
        version: z.string(),
        workspace: z.string(),
      })
      .parse(data)

    const zipUrl = `${CDN_URL}/nw-data/${options.version}.zip?cache=${Date.now()}`
    const zipFile = environment.nwDataDir(options.workspace) + '.zip'
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
    console.log('Downloading...')
    const multibar = new MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {name} | {percentage}%',
      },
      Presets.shades_grey
    )
    const b1 = multibar.create(100, 0)

    await download(zipUrl, zipFile, (downloaded, total) => {
      b1.setTotal(total)
      b1.update(downloaded, { name: zipFile })
    })
    multibar.stop()

    console.log('Unzipping to', zipDir)
    await unzip(zipFile, zipDir)
    fs.unlinkSync(zipFile)

    const trash = path.join(zipDir, '__MACOSX')
    if (fs.existsSync(trash)) {
      fs.rmSync(trash, { recursive: true })
    }
    if (fs.existsSync(zipFile)) {
      fs.rmSync(zipFile)
    }
  })

program
  .command('upload')
  .description('Zips nw-data folder (live or ptr) and uploads to CDN. Optionally uploads all files unzipped.')
  .option('-ws, --workspace', 'workspace folder to upload (ptr or live)', NW_GAME_VERSION)
  .option('-v, --version <version>', 'Version name to use for upload', path.basename(environment.nwDataDir(NW_GAME_VERSION)))
  .option('-u, --update', 'Whether to update the zip file before upload', false)
  .option('-f, --files', 'Whether to upload unzipped folder to CDN', false)
  .action(async (data) => {
    const options = z
      .object({
        version: z.string(),
        workspace: z.string(),
        update: z.boolean(),
        files: z.boolean(),
      })
      .parse(data)

    const zipDir = environment.nwDataDir(options.workspace)
    const zipFile = path.join(zipDir, '..', options.version + '.zip')
    const zipFileKey = path.relative(environment.distDir(), zipFile)
    const client = createClient()

    const toUpload = [
      {
        file: zipFile,
        key: zipFileKey,
      },
    ]

    if (!fs.existsSync(zipFile) || options.update) {
      console.log('[ZIP]', zipDir, '->', zipFile)
      await createBundle(zipDir, zipFile)
    }

    if (options.files) {
      await glob(path.join(zipDir, '**', '*')).then((files) => {
        for (const file of files) {
          toUpload.push({
            file: file,
            key: normalizeKey(path.join('nw-data', options.version, path.relative(zipDir, file))),
          })
        }
      })
    }

    console.log('[UPLOAD]')
    await uploadFiles({
      client: client,
      files: toUpload,
    })
  })

program
  .command('upload-models')
  .option('-f, --force', 'Uploads all files, instead of only new')
  .action(async () => {
    const options = z
      .object({
        force: z.boolean().optional(),
      })
      .parse(program.opts())

    const modelsDir = environment.nwModelsDir()
    const client = createClient()

    const glbObjects = await Promise.resolve(options)
      .then((it) => {
        return it.force ? [] : listObjects(client)
      })
      .then((list) => list.filter((it) => it.Key.endsWith('.glb')))
      .then((list) => list.map((it) => normalizeKey(it.Key)))
      .then((list) => new Set(list))
    const glbFiles = await glob(path.join(modelsDir, '**/*.glb')).then((list) => {
      return list.map((file) => {
        const extname = path.extname(file).toLowerCase()
        return {
          file: file,
          key: normalizeKey(path.join('models', path.relative(modelsDir, file))),
          contentType: extname == '.gltf' ? 'model/gltf+json' : 'model/gltf-binary',
          md5: true,
        }
      })
    })
    const toUpload = glbFiles.filter((it) => {
      return !glbObjects.has(it.key)
    })
    console.log('found', glbFiles.length, '.glb files', 'to upload', toUpload.length)
    await uploadFiles({
      client: createClient(),
      files: toUpload,
    })
  })

program.parse(process.argv)

async function download(url: string, target: string, onProgress?: (downloaded: number, total: number) => void) {
  const file = fs.createWriteStream(target)

  return new Promise((resolve, reject) => {
    http.get(url, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    }, (response) => {
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
    })
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
  zip.addLocalFolder(dir, path.basename(dir))
  zip.writeZip(file)
}

async function uploadFiles({
  client,
  files,
  parallel,
}: {
  client: S3
  files: Array<{ file: string; key: string; contentType?: string }>
  parallel?: number
}) {
  parallel = Math.max(1, Math.min(parallel || 20, files.length))

  const totalFiles = files.length
  const batches = []
  while (files.length > 0) {
    for (let i = 0; i < parallel; i++) {
      if (files.length > 0) {
        batches[i] = batches[i] || []
        batches[i].push(files.pop())
      }
    }
  }

  const multibar = new MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: '{percentage}% {value}/{total} {name}',
    },
    Presets.shades_grey
  )
  const b1 = multibar.create(totalFiles, 0)
  let filesDone = 0
  function barUpdate() {
    filesDone++
    b1.update(filesDone, { name: 'files' })
  }

  await Promise.all(
    batches.map(async (batch) => {
      const b2 = multibar.create(batch.length, 0)
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i]
        const file = item.file
        const key = item.key.replace(/\\/g, '/').toLowerCase()
        const contentType = item.contentType || mime.lookup(path.basename(file)) || 'application/octet-stream'
        const fileHash = calculateHash(file)

        barUpdate()
        b2.update(i + 1, { name: key })

        const oldHash = await client
          .headObject({ Bucket: config.bucket, Key: key })
          .then((data) => data?.Metadata['x-amz-meta-file-hash'])
          .catch((err) => null)

        if (fileHash === oldHash) {
          continue
        }
        const upload = new Upload({
          params: {
            Bucket: config.bucket,
            Key: key,
            Body: fs.createReadStream(file),
            ACL: 'public-read',
            ContentType: contentType,
            Metadata: {
              'x-amz-meta-file-hash': fileHash,
            },
          },
          client: client,
          queueSize: 3,
        })
        upload.on('httpUploadProgress', (progress) => {
          //
        })
        await upload.done()
      }
      b2.update(batch.length, { name: 'done' })
    })
  )

  multibar.stop()
}

async function listObjects(client: S3 = createClient()) {
  console.log('listing objects...')
  const files: Array<_Object> = []
  let marker: string | undefined = undefined
  do {
    const data = await client.listObjects({
      Bucket: config.bucket,
      MaxKeys: 1000,
      Marker: marker,
    })
    files.push(...data.Contents)
    marker = data.NextMarker
  } while (marker)
  return files
}

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

function calculateHash(filePath: string) {
  const hash = createHash('sha256')
  const fileData = fs.readFileSync(filePath)
  hash.update(fileData)
  return hash.digest('hex')
}
