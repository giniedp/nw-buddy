import { saveAs } from 'file-saver'

export function isClipboardSupported(win = window) {
  return !!win?.['ClipboardItem']
}

export function saveBlobToClipoard(blob: Blob, type = blob.type) {
  if (!isClipboardSupported()) {
    throw new Error('Clipboard is not supported')
  }

  return navigator.clipboard.write([
    new ClipboardItem({
      [type]: blob,
    }),
  ])
}

export async function saveBlobToFile(blob: Blob, filename: string) {
  const showSaveFilePicker = window['showSaveFilePicker'] as any
  if (!showSaveFilePicker) {
    return saveAs(blob, filename)
  }

  const handle = await showSaveFilePicker({
    suggestedName: filename,
  })
  if (await verifyPermission(handle)) {
    await writeFile(handle, blob)
  }
}

async function writeFile(fileHandle: any, contents: Blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}

async function verifyPermission(fileHandle: any) {
  const options = {
    mode: 'readwrite',
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}
