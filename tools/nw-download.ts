import { program } from 'commander'
import * as fs from 'fs'
import * as http from 'https'
import * as path from 'path'
import * as unzipper from 'unzipper'
import { cdnPath, NW_USE_PTR } from '../env'

program
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .option('-o, --output <path>', 'output directory')
  .action(async () => {
    const options = program.opts<{ ptr: string; output: string }>()
    const input = cdnPath(options.ptr) + '.zip'
    const outDir = options.output
    const zipFile = path.join(outDir, path.basename(input))

    console.log('Download', input, '->', zipFile)

    if (!fs.existsSync(outDir)) {
      console.log('Create dir', outDir)
      fs.mkdirSync(outDir, { recursive: true })
    }
    if (fs.existsSync(zipFile)) {
      console.log('Remove existing file', zipFile)
      fs.unlinkSync(zipFile)
    }
    console.log('Downloading...')
    await download(input, zipFile)

    console.log('Unzipping to', outDir)
    await unzip(zipFile, outDir)
    fs.unlinkSync(zipFile)

    const trash = path.join(outDir, '__MACOSX')
    if (fs.existsSync(trash)) {
      fs.rmSync(trash, { recursive: true })
    }
  })

program.parse(process.argv)

function download(url: string, target: string) {
  const file = fs.createWriteStream(target)
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
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

function unzip(file: string, target: string) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(unzipper.Extract({ path: target }))
      .on('close', resolve)
      .on('error', reject)
  })
}
