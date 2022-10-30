import { PutObjectCommand, PutObjectCommandInput, S3 } from '@aws-sdk/client-s3'
import { MultiBar, Presets } from 'cli-progress'
import { program } from 'commander'
import * as fs from 'fs'
import * as mime from 'mime-types'
import * as path from 'path'
import {
  CDN_UPLOAD_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_UPLOAD_SPACE,
  nwData,
  NW_USE_PTR,
} from '../env'
import { glob } from './utils'

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .command('bundle')
  .action(async () => {
    const options = program.opts<{ ptr: boolean }>()
    await uploadBundle(nwData.distDir(options.ptr) + '.zip')
  })

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .command('all')
  .action(async () => {
    const options = program.opts<{ ptr: boolean }>()
    await uploadAll(nwData.distDir(options.ptr)!)
  })

program.parse(process.argv)

async function uploadBundle(file: string) {
  console.log('[UPLOAD]', file)
  const client = createClient()
  const files = [file]
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const key = path.relative(nwData.dist(), file)
    await client.send(
      new PutObjectCommand({
        Bucket: CDN_UPLOAD_SPACE,
        Key: key,
        Body: fs.readFileSync(file),
        ACL: 'public-read',
      })
    )
  }
}

async function uploadAll(from: string) {
  console.log('[UPLOAD]', from)
  const client = createClient()
  const files = await glob([path.join(from, '**', '*'), '!**/*.json'])
  const bars = new MultiBar(
    {
      stopOnComplete: true,
      clearOnComplete: false,
      hideCursor: true,
    },
    Presets.shades_grey
  )
  const bar = bars.create(files.length, 0, {})
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const key = path.relative(nwData.dist(), file)
    const params: PutObjectCommandInput = {
      Bucket: CDN_UPLOAD_SPACE,
      Key: key,
      Body: fs.readFileSync(file),
      ACL: 'public-read',
      ContentType: mime.lookup(file) || 'application/octet-stream',
    }
    if (params.ContentType === 'application/gzip') {
      params.Key = params.Key.replace(/\.gz$/, '')
      params.ContentType = mime.lookup(params.Key) || 'application/octet-stream'
      params.ContentEncoding = 'gzip'
    }
    bar.update(i)
    await client.send(new PutObjectCommand(params))
  }
  bar.update(files.length, { filename: '' })
}

function createClient() {
  return new S3({
    forcePathStyle: false,
    endpoint: CDN_UPLOAD_ENDPOINT,
    // Note, specifying us-east-1 does not result in slower performance, regardless of your Space’s location.
    // The SDK checks the region for verification purposes but never sends the payload there.
    // Instead, it sends the payload to the specified custom endpoint.
    region: 'us-east-1',
    credentials: {
      accessKeyId: CDN_UPLOAD_KEY,
      secretAccessKey: CDN_UPLOAD_SECRET,
    }
  })
}
