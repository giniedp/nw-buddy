import { S3, _Object } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import * as AdmZip from 'adm-zip'
import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as http from 'https'
import * as path from 'path'
import { CDN_UPLOAD_ENDPOINT, CDN_UPLOAD_KEY, CDN_UPLOAD_SECRET, CDN_UPLOAD_SPACE, NW_USE_PTR, nwData } from '../env'
import { glob } from './utils/file-utils'

const config = {
  bucket: CDN_UPLOAD_SPACE,
  key: CDN_UPLOAD_KEY,
  secret: CDN_UPLOAD_SECRET,
  endpoint: CDN_UPLOAD_ENDPOINT,
}

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .option('-o, --output <path>', 'output directory')
  .command('download')
  .action(async () => {
    const options = program.opts<{ ptr: boolean; output: string }>()
    const input = nwData.cdnUrl(options.ptr) + '.zip'
    const outDir = options.output || nwData.dist()
    const zipFile = path.join(outDir, path.basename(input))
    console.log(options)
    console.log('[DOWNLOAD]', input)

    if (!fs.existsSync(outDir)) {
      console.log('Create dir', outDir)
      fs.mkdirSync(outDir, { recursive: true })
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

    await download(input, zipFile, (downloaded, total) => {
      b1.setTotal(total)
      b1.update(downloaded, { name: zipFile })
    })
    multibar.stop()

    console.log('Unzipping to', outDir)
    await unzip(zipFile, outDir)
    fs.unlinkSync(zipFile)

    const trash = path.join(outDir, '__MACOSX')
    if (fs.existsSync(trash)) {
      fs.rmSync(trash, { recursive: true })
    }
    if (fs.existsSync(zipFile)) {
      fs.rmSync(zipFile)
    }
  })

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .option('-u, --update', 'Update zip file')
  .command('upload')
  .action(async () => {
    const options = program.opts<{ ptr: boolean; update: boolean }>()
    const assetsDir = nwData.distDir(options.ptr)
    const zipFile = assetsDir + '.zip'
    if (!fs.existsSync(zipFile) || options.update) {
      console.log('[ZIP]', assetsDir, '->', zipFile)
      await createBundle(assetsDir, zipFile)
    }
    await uploadFiles(createClient(), [
      {
        file: zipFile,
        key: path.relative(nwData.dist(), zipFile),
      },
    ])
  })

program
  .option('-f, --force', 'Uploads all files, instead of only new')
  .command('upload-models')
  .action(async () => {
    const options = program.opts<{ force: boolean }>()
    const modelsDir = nwData.modelsDir()
    const client = createClient()

    function normalizeKey(key: string) {
      return key.replace(/\\/g, '/').toLowerCase()
    }

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
    await uploadFiles(createClient(), toUpload)
  })

program.parse(process.argv)

async function download(url: string, target: string, onProgress?: (downloaded: number, total: number) => void) {
  const file = fs.createWriteStream(target)
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
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

async function uploadFiles(
  client: S3,
  files: Array<{ file: string; key: string; contentType?: string; md5?: boolean }>
) {
  const multibar = new MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: ' {bar} {percentage}% | {name} | {value}/{total} | {eta_formatted} ({duration})',
    },
    Presets.shades_grey
  )
  const b1 = multibar.create(files.length, 0)
  const b2 = multibar.create(100, 0)

  for (let i = 0; i < files.length; i++) {
    const item = files[i]
    const file = item.file
    const key = item.key.replace(/\\/g, '/').toLowerCase()
    const contentType = item.contentType || 'application/octet-stream'

    b1.update(i + 1, { name: 'files' })
    b2.update(0, { name: key })

    const upload = new Upload({
      params: {
        Bucket: config.bucket,
        Key: key,
        Body: fs.createReadStream(file),
        ACL: 'public-read',
        ContentType: contentType,
      },
      client: client,
      queueSize: 3,
    })
    upload.on('httpUploadProgress', (progress) => {
      b2.setTotal(progress.total)
      b2.update(progress.loaded, { name: key })
    })
    await upload.done()
  }

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

function md5FromFile(file: string) {
  const buff = fs.readFileSync(file)
  return createHash('md5').update(buff).digest('hex')
}
