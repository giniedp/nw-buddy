export function imageFileFromPaste(e: ClipboardEvent) {
  return imageFromDataTransfer(e.clipboardData)
}

export function imageFromDropEvent(e: DragEvent) {
  return imageFromDataTransfer(e.dataTransfer)
}

export function imageFromDataTransfer(transfer: DataTransfer) {
  const items = transfer.items
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.includes('image')) {
      return items[i].getAsFile()
    }
  }
  return null
}
