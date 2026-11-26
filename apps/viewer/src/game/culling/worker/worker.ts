/// <reference lib="webworker" />
import { CullingEngine } from './CullingEngine'
import type { CullingToMain, MainToCulling } from './protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope

const engine = new CullingEngine({
  post: (message: CullingToMain, transfer?: Transferable[]) => {
    scope.postMessage(message, transfer ?? [])
  },
})

scope.addEventListener('message', (event: MessageEvent<MainToCulling>) => {
  engine.handle(event.data)
})
