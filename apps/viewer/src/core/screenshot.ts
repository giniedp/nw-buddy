/**
 * Screenshots of a WebGPU canvas. The canvas can only be read in the task that renders the frame: {@link request}
 * queues a capture, {@link flush} runs it after the draw (`onEndDraw`).
 */
export class ScreenshotQueue {
  private requests: Array<(image: Blob | null) => void> = []

  /**
   * Captures the next rendered frame as PNG, null if it failed
   */
  public request(): Promise<Blob | null> {
    return new Promise((resolve) => this.requests.push(resolve))
  }

  /**
   * Captures the canvas for the queued requests, if any
   *
   * @param background - fills the image first, the output may contain transparent pixels. Null keeps them.
   */
  public flush(source: HTMLCanvasElement | OffscreenCanvas, background: string | null = '#000') {
    if (!this.requests.length) {
      return
    }
    const requests = this.requests.splice(0)
    const canvas = new OffscreenCanvas(source.width, source.height)
    const context = canvas.getContext('2d')
    if (background) {
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(source, 0, 0)
    canvas.convertToBlob({ type: 'image/png' }).then(
      (image) => requests.forEach((resolve) => resolve(image)),
      (err) => {
        console.warn('screenshot failed', String(err))
        requests.forEach((resolve) => resolve(null))
      },
    )
  }
}
