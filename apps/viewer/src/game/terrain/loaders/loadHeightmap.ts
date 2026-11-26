import { PriorityLane, SchedulerSystem, type ScheduledTask } from '@gglib/components'
import { getRegionHeightmapUrl } from '../../../api'
import type { ContentService } from '../../../content'
import { copyToShared } from '../../shared/sharedMemory'

export function loadHeightmap(
  content: ContentService,
  scheduler: SchedulerSystem,
  level: string,
  regionName: string,
  done: (result: Uint16Array<ArrayBufferLike>) => void,
): ScheduledTask {
  return scheduler.schedule<Uint16Array<ArrayBufferLike>>({
    lane: PriorityLane.Critical,
    context: null,
    load: async (task) => {
      const request = getRegionHeightmapUrl(level, regionName)
      // shared memory, so the collision worker can sample it without a copy
      task.context = await content.fetchTypedRequest(request).then((buffer) => new Uint16Array(copyToShared(buffer)))
    },
    finalize: (task, err) => {
      done(err ? null : task.context)
    },
  })
}
