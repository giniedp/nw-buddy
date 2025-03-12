import { ImageLike, useTesseract } from '~/utils/use-tesseract'

export async function recognizeTextFromImage(image: ImageLike, options?: { minConfidence?: number }) {
  const processedImage = await processAndTransformImage(image)
  const minConfidence = options?.minConfidence ?? 0
  const tesseract = await useTesseract()
  const result = await tesseract.recognize(processedImage)
  const lines = result.data.lines.map((line) => {
    return line.words
      .filter((it) => it.confidence >= minConfidence)
      .map((it) => it.text.trim())
      .join(' ')
  })
  return lines
}

// Takes in the image and does some processing to make it easier for Tesseract to recognize the text we want
async function processAndTransformImage(imageBlob: ImageLike) {
  // Check if imageBlob is Blob or MediaSource, if not, return it early without processing it
  if (!(imageBlob instanceof Blob) && !(imageBlob instanceof MediaSource)) {
    return imageBlob
  }

  // Create an in-memory canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Create and load image from the blob
  const img = new Image()
  const imageUrl = URL.createObjectURL(imageBlob)
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve()
    }
    img.onerror = reject
    img.src = imageUrl
  })

  // Resize canvas to maintain aspect ratio with a max width of 480
  const rectSize = img.width * 0.28
  const stripeSize = img.width * 0.14
  canvas.width = img.width
  canvas.height = img.height

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0)

  // Grayscale conversion and curves effect
  // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  // const data = imageData.data
  // const brightnessMin = 89 // Adjust this to tweak the how extreme the curve effect is, 89 seems to be a consistent min

  // // Loop through each pixel and apply the effects
  // for (let i = 0; i < data.length; i += 4) {
  //   // Convert to grayscale
  //   const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
  //   data[i] = data[i + 1] = data[i + 2] = avg

  //   // Apply curves effect
  //   const brightness = avg
  //   if (brightness > brightnessMin) {
  //     const increase = (255 - brightness) * 1
  //     data[i] = data[i + 1] = data[i + 2] = Math.min(255, avg + increase)
  //   } else {
  //     const decrease = brightness * 1
  //     data[i] = data[i + 1] = data[i + 2] = Math.max(0, avg - decrease)
  //   }
  // }

  // ctx.putImageData(imageData, 0, 0)

  // Draw black squares on the canvas to cover up icons that can confuse Tesseract
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, rectSize, rectSize)
  ctx.fillRect(0, 0, stripeSize, canvas.height)

  // Convert canvas to a data URL and then to a blob
  const dataURL = canvas.toDataURL('image/png', 1.0)
  // For debugging, copy this to your browser to see what the image looks like
  // console.log(dataURL)

  const processedBlob = await fetch(dataURL).then((res) => res.blob())
  return processedBlob
}
