import { Renderer } from '@gglib/render'
import type { GraphRow } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import type { GraphTab } from './types'

/**
 * The stats graph rows, grouped into tabs so each graph stays readable
 */
export function graphTabs(viewer: NwViewer): GraphTab[] {
  const mb = (bytes: number) => bytes / 1024 / 1024
  return [
    {
      title: 'Frame',
      rows: [
        curve('Frame Time', 100, () => viewer.stats.frameTime.current * 1000),
        curve('FPS', 240, () => viewer.stats.fps.current),
        curve('Update (ms)', 50, () => viewer.world.stats.update.current),
        curve('Draw (ms)', 50, () => viewer.stats.draw.current),
        counter('Tasks total', () => viewer.schedulerStats?.total || 0),
        counter('Tasks in Flight', () => viewer.schedulerStats?.inFlight || 0),
      ],
    },
    {
      title: 'Render',
      rows: [
        curve('Lists collect (ms)', 20, () => viewer.renderStats?.listCollectMs ?? 0),
        curve('Lists sort (ms)', 20, () => viewer.renderStats?.listSortMs ?? 0),
        curve('Lists batch (ms)', 20, () => viewer.renderStats?.listBatchMs ?? 0),
        counter('List items', () => viewer.renderStats?.listItems ?? 0),
        counter('Draw count', () => viewer.renderStats?.drawCount || 0),
        counter('Visible count', () => viewer.sceneStats?.visible || 0),
      ],
    },
    {
      title: 'Memory',
      rows: [
        curve('Frame (MB)', 2048, () => mb(viewer.world.getSystem(Renderer).resourceSizeInBytes)),
        curve('Heap (MB)', 2048, () => mb((performance as any).memory?.usedJSHeapSize ?? 0)),
        curve('Textures', 1000, () => viewer.deviceStats?.textureCount || 0),
        curve('Texture (MB)', 2048, () => mb(viewer.deviceStats?.textureByteCount || 0)),
        curve('Shaders', 20, () => viewer.deviceStats?.shaderCount || 0),
      ],
    },
  ]
}

/**
 * A graph row with a smoothed curve
 */
function curve(name: string, max: number, sample: () => number): GraphRow {
  return { name, min: 0, max, smoothing: 0.9, sample }
}

/**
 * A text only row (no curve) for integer counters
 */
function counter(name: string, sample: () => number): GraphRow {
  return { name, min: 0, max: 1, sample, noGraph: true, fractionDigits: 0 }
}
