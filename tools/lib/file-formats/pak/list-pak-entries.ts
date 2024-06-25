import { Entry, Options, ZipFile, fromFd, open } from 'yauzl'

export async function listPakEntries(pathOrFileDescriptor: string | number, predicate?: (entry: string) => boolean) {
  return new Promise<Entry[]>((resolve, reject) => {

    const entries: Entry[] = []
    const walker = walkEntries({
      onError: reject,
      onEntry: (entry) => {
        if (!predicate || predicate(entry.fileName)) {
          // debug(`include ${entry.compressionMethod} ${entry.fileName}`)
          entries.push(entry)
        } else {
          // debug(`exclude ${entry.compressionMethod} ${entry.fileName}`)
        }
      },
      onEnd: () => resolve(entries),
    })
    const options: Options = {
      lazyEntries: true,
      autoClose: false,
      decodeStrings: true,
      strictFileNames: false,
      validateEntrySizes: false,
    }
    if (typeof pathOrFileDescriptor === 'number') {
      options.autoClose = false
      return fromFd(pathOrFileDescriptor, options, walker)
    } else {
      options.autoClose = true
      return open(pathOrFileDescriptor, options, walker)
    }
  })
}

function walkEntries(options: {
  onError: (err: Error) => void
  onEntry: (entry: Entry) => void
  onEnd: () => void
}) {
  return (err: Error, zip: ZipFile) => {
    if (err) {
      options.onError(err)
      return
    }
    zip.on('entry', (entry: Entry) => {
      options.onEntry(entry)
      zip.readEntry()
    })
    zip.once('end', () => {
      options.onEnd()
    })
    zip.readEntry()
  }
}
