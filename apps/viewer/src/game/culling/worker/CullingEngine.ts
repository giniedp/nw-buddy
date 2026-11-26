import { CullingWorld } from './CullingWorld'
import type { CullingToMain, MainToCulling } from './protocol'

export interface CullingEngineOptions {
  post: (message: CullingToMain, transfer?: Transferable[]) => void
}

export class CullingEngine {
  public post: CullingEngineOptions['post']
  public readonly world = new CullingWorld()

  public constructor(options: CullingEngineOptions) {
    this.post = options.post
  }

  public handle(message: MainToCulling) {
    switch (message.type) {
      case 'update': {
        this.world.addBatches(message.batches)
        for (const id of message.removes) {
          this.world.remove(id)
        }
        for (const record of message.adds) {
          this.world.add(record)
        }
        for (const level of message.levels) {
          this.world.setLevel(level.id, level.level, level.data)
        }
        break
      }
      case 'cull': {
        const result = this.world.cull(message, message.buffers)
        this.post({ type: 'result', ...result }, [result.transforms.buffer, result.data.buffer, result.batches.buffer])
        break
      }
      case 'raycast': {
        const hits = this.world.raycast(message.origin, message.direction, message.maxDistance)
        this.post({ type: 'raycast', id: message.id, hits })
        break
      }
    }
  }
}
