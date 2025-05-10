export type StatsGroup = ReturnType<typeof statsGroup>
export function statsGroup() {
  const fpsPanel = statsGraph({ name: 'FPS', foreground: '#0ff', background: '#002', maxValue: 200 })
  const msPanel = statsGraph({ name: 'MS', foreground: '#0f0', background: '#020', maxValue: 100 })
  let memPanel: StatsGraph
  if (performance && performance['memory']) {
    memPanel = statsGraph({
      name: 'MB',
      foreground: '#f08',
      background: '#201',
      maxValue: performance['memory'].jsHeapSizeLimit / (1024 * 1024),
    })
  }

  let beginTime: number = null
  let frames: number = null
  let prevTime: number = null
  return {
    panels: [fpsPanel, msPanel, memPanel].filter((it) => !!it),
    update: () => {
      if (beginTime == null) {
        beginTime = (performance || Date).now()
        prevTime = beginTime
        frames = 0
        return
      }

      frames++
      const time = (performance || Date).now()
      msPanel.update(time - beginTime)

      if (time >= prevTime + 1000) {
        fpsPanel.update((frames * 1000) / (time - prevTime))
        if (memPanel) {
          memPanel.update(performance['memory'].usedJSHeapSize / (1024 * 1024))
        }

        prevTime = time
        frames = 0
      }

      beginTime = (performance || Date).now()
    },
  }
}

export type StatsGraph = ReturnType<typeof statsGraph>
export interface StatsPanelOptions {
  name: string
  foreground: string
  background: string
  width?: number
  height?: number
  border?: number
  font?: string
  fontSize?: number
  maxValue?: number
}
export function statsGraph(options: StatsPanelOptions) {
  let min = Infinity
  let max = 0

  const maxValue = options.maxValue || 100
  const name = options.name || 'Stats'
  const background = options.background || '#000000'
  const foreground = options.foreground || '#ffffff'
  const font = options.font || 'Helvetica,Arial,sans-serif'
  const fontSize = Math.max(options.fontSize || 0, 10)
  const w = Math.max(options.width || 0, 120)
  const h = Math.max(options.height || 0, 48)
  const b = Math.max(options.border || 0, 3)
  const l = Math.floor(fontSize * 1.5)
  const ratio = Math.round(window.devicePixelRatio || 1)
  const WIDTH = w * ratio
  const HEIGHT = h * ratio
  const TEXT_X = b * ratio
  const TEXT_Y = b * ratio
  const GRAPH_X = b * ratio
  const GRAPH_Y = l * ratio
  const GRAPH_WIDTH = (w - b - b) * ratio
  const GRAPH_HEIGHT = (h - l - b) * ratio

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`

  const context = canvas.getContext('2d')
  context.font = `bold ${fontSize * ratio}px ${font}`
  context.textBaseline = 'top'

  context.fillStyle = background
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.fillStyle = foreground
  context.fillText(name, TEXT_X, TEXT_Y)
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  context.fillStyle = background
  context.globalAlpha = 0.9
  context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

  return {
    canvas,
    reset: () => {
      min = Infinity
      max = 0
    },
    update: (value: number) => {
      min = Math.min(min, value)
      max = Math.max(max, value)

      context.fillStyle = background
      context.globalAlpha = 1
      context.fillRect(0, 0, WIDTH, GRAPH_Y)
      context.fillStyle = foreground
      context.fillText(`${name}: ${Math.round(value)} (${Math.round(min)}-${Math.round(max)})`, TEXT_X, TEXT_Y)

      context.drawImage(
        canvas,
        GRAPH_X + ratio,
        GRAPH_Y,
        GRAPH_WIDTH - ratio,
        GRAPH_HEIGHT,
        GRAPH_X,
        GRAPH_Y,
        GRAPH_WIDTH - ratio,
        GRAPH_HEIGHT,
      )

      context.fillRect(GRAPH_X + GRAPH_WIDTH - ratio, GRAPH_Y, ratio, GRAPH_HEIGHT)

      context.fillStyle = background
      context.globalAlpha = 0.9
      context.fillRect(GRAPH_X + GRAPH_WIDTH - ratio, GRAPH_Y, ratio, Math.round((1 - value / maxValue) * GRAPH_HEIGHT))
    },
  }
}
