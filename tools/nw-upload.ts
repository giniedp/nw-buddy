import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { program } from 'commander'
import * as path from 'path'
import * as fs from 'fs'
import * as mime from 'mime-types'
import {
  importDir,
  nwDataRoot,
  NW_PTR,
  CDN_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_SPACE,
} from '../env'
import { glob } from './utils'
import { MultiBar, Presets } from 'cli-progress'

program
  .option('-i, --input <path>', 'input directory')
  .option('-z, --gzip', 'gzip assets', true)
  .option('-o, --output <path>', 'output directory')
  .option('--ptr', 'PTR mode', NW_PTR)
  .action(async () => {
    const options = program.opts<{ input: string; output: string; ptr: boolean }>()
    const input = options.input || importDir(options.ptr)!
    const client = createClient()

    const files = await glob([path.join(input, '**', '*'), '!**/*.json'])
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
      const key = path.relative(nwDataRoot, file)
      bar.update(i)
      await client.send(
        new PutObjectCommand({
          Bucket: CDN_SPACE,
          Key: key,
          Body: fs.readFileSync(file),
          ACL: "public-read",
          ContentType: mime.lookup(file) || 'application/octet-stream'
        })
      )
    }
    bar.update(files.length, { filename: '' })
  })
  .parse(process.argv)

function createClient() {
  return new S3({
    forcePathStyle: false,
    endpoint: CDN_ENDPOINT,
    // Note, specifying us-east-1 does not result in slower performance, regardless of your Space’s location.
    // The SDK checks the region for verification purposes but never sends the payload there.
    // Instead, it sends the payload to the specified custom endpoint.
    region: 'us-east-1',
    credentials: {
      accessKeyId: CDN_UPLOAD_KEY,
      secretAccessKey: CDN_UPLOAD_SECRET,
    },
  })
}
