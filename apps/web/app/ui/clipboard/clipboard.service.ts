import { DOCUMENT } from '@angular/common'
import { Injectable, inject } from '@angular/core'
import { saveAs } from 'file-saver'

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private window = inject(DOCUMENT).defaultView

  public get isSupported() {
    return !!this.window['ClipboardItem']
  }

  public saveBlobToClipoard(blob: Blob, type: string) {
    if (!this.isSupported) {
      throw new Error('Clipboard is not supported')
    }
    return navigator.clipboard.write([
      new ClipboardItem({
        [type]: blob,
      }),
    ])
  }

  public async saveBlobToFile(blob: Blob, filename: string) {
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
}

async function writeFile(fileHandle, contents: Blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}

async function verifyPermission(fileHandle) {
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
