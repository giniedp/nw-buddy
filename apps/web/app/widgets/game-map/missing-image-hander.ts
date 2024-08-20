import { Map, MapLibreEvent, MapStyleImageMissingEvent } from 'maplibre-gl'

export function missingImageHandler({ iconSize }: { iconSize: number }) {
  const pending: Record<string, Promise<HTMLImageElement | ImageBitmap | ImageData>> = {}

  function limitIconSize(img: HTMLImageElement | ImageBitmap) {
    if (iconSize && (img.width > iconSize || img.height > iconSize)) {
      return renderIcon(img, iconSize)
    }
    return img
  }

  function loadImage(map: Map, src: string) {
    if (!pending[src]) {
      pending[src] = map
        .loadImage(src)
        .then((it) => limitIconSize(it.data))
        .then((image) => {
          delete pending[src]
          return image
        })
    }
    return pending[src]
  }

  const nullIcon = renderIcon(null, iconSize || 32)
  return (e: MapStyleImageMissingEvent) => {
    const map = e.target
    map.addImage(e.id, nullIcon)
    loadImage(map, e.id).then((img) => {
      map.removeImage(e.id)
      map.addImage(e.id, img)
    })
  }
}

let canvas: HTMLCanvasElement
function renderIcon(img: HTMLImageElement | ImageBitmap, size: number) {
  const canvas = getCanvas()
  canvas.width = size
  canvas.height = size

  const ctx = getContext()
  ctx.fillStyle = 'white'
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (img) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  }
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function getCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas')
  }
  return canvas
}

function getContext() {
  return getCanvas().getContext('2d', {
    willReadFrequently: true,
  })
}
