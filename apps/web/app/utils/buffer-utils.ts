export async function bufferToBase64(buffer: ArrayBuffer) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
      resolve(base64)
    }
    reader.readAsDataURL(blob)
  })
}

export async function base64ToBuffer(data: string): Promise<ArrayBuffer> {
  return fetch(`data:application/octet-stream;base64,${data}`).then((res) => res.arrayBuffer())
}
