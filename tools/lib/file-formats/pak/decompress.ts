import concat from 'concat-stream'
import { Entry, ZipFile, fromFd } from 'yauzl'

export async function decompressEntry(zipFd: number, entry: Entry, oodle: { OodleLZ_Decompress: Function }) {
  return new Promise<Buffer>((resolve, reject) => {
    fromFd(zipFd, { lazyEntries: true, autoClose: false }, async (err, zip) => {
      if (err) {
        reject(err)
        return
      }
      if (entry.compressionMethod === 0 || entry.compressionMethod === 8) {
        readEntry(zip, entry, entry.isCompressed()).then(resolve).catch(reject)
        return
      }
      if (entry.compressionMethod === 15) {
        const compressionMethod = entry.compressionMethod
        const compressedSize = entry.compressedSize
        const uncompressedSize = entry.uncompressedSize

        // reset compression method to 0, so that readEntry returns raw data
        // and does not throw error about unknown compression method
        entry.compressionMethod = 0
        entry.uncompressedSize = entry.compressedSize

        const compressedData = await readEntry(zip, entry, null)
        const uncompressedData = Buffer.alloc(uncompressedSize)

        // restore
        entry.compressionMethod = compressionMethod
        entry.uncompressedSize = uncompressedSize

        oodle.OodleLZ_Decompress(
          compressedData,
          compressedSize,
          uncompressedData,
          uncompressedSize,
          0,
          0,
          0,
          null,
          null,
          null,
          null,
          null,
          null,
          3,
        )
        resolve(uncompressedData)
        return
      }
      reject(new Error(`unsupported compression method '${entry.compressionMethod}' '${entry.fileName}'`))
    })
  })
}

function readEntry(zip: ZipFile, entry: Entry, decompress: boolean) {
  return new Promise<Buffer>((resolve, reject) => {
    zip.openReadStream(
      entry,
      {
        decompress: decompress ? true : null,
        decrypt: null,
        start: 0,
        end: entry.compressedSize,
      },
      (err, stream) => {
        if (err) {
          reject(err)
          return
        }
        stream.pipe(concat(resolve))
      },
    )
  })
}
