import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { program } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import {
  CDN_UPLOAD_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_UPLOAD_SPACE,
  nwData,
  NW_USE_PTR
} from '../env'
import * as AdmZip from 'adm-zip'

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options = program.opts<{ ptr: boolean }>()
    const assetsDir = nwData.distDir(options.ptr)
    const zipFile = assetsDir + '.zip'
    console.log('[ZIP]', assetsDir, '->', zipFile)
    await createBundle(assetsDir, zipFile)
    await uploadBundle(nwData.distDir(options.ptr) + '.zip')
  })

program.parse(process.argv)

async function createBundle(dir: string, file: string) {
  const zip = new AdmZip();
  zip.addLocalFolder(dir, path.basename(dir))
  zip.writeZip(file);
}

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
