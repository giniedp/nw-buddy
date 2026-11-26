/**
 * Min and max of every pixel column of a waveform, all channels in one: [min0, max0, min1, max1, …]
 */
export function waveformPeaks(buffer: AudioBuffer, width: number): Float32Array {
  const peaks = new Float32Array(width * 2)
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i))
  const step = buffer.length / width
  for (let x = 0; x < width; x++) {
    let min = 0
    let max = 0
    const end = Math.min(buffer.length, Math.floor((x + 1) * step))
    for (const data of channels) {
      for (let i = Math.floor(x * step); i < end; i++) {
        min = Math.min(min, data[i])
        max = Math.max(max, data[i])
      }
    }
    peaks[x * 2] = min
    peaks[x * 2 + 1] = max
  }
  return peaks
}

/**
 * The peaks of the last drawn waveform, computed again only for another clip or width
 */
let lastPeaks: { buffer: AudioBuffer; width: number; peaks: Float32Array } | null = null

/**
 * The waveform of a clip, the played part in the accent color
 */
export function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, progress: number | null) {
  const width = Math.floor(canvas.clientWidth * devicePixelRatio)
  const height = Math.floor(canvas.clientHeight * devicePixelRatio)
  const ctx = canvas.getContext('2d')
  if (!ctx || !width || !height) {
    return
  }
  canvas.width = width
  canvas.height = height
  if (lastPeaks?.buffer !== buffer || lastPeaks.width !== width) {
    lastPeaks = { buffer, width, peaks: waveformPeaks(buffer, width) }
  }
  const { peaks } = lastPeaks
  const style = getComputedStyle(canvas)
  const played = style.getPropertyValue('--nw-accent')
  const mid = height / 2
  for (let x = 0; x < width; x++) {
    const min = peaks[x * 2]
    const max = peaks[x * 2 + 1]
    ctx.fillStyle = progress != null && x / width <= progress ? played : style.color
    ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid))
  }
}
