/// <reference lib="webworker" />
import { CollisionEngine } from './CollisionEngine'
import type { MainToCollision, CollisionToMain } from './protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope

const engine = new CollisionEngine({
  post: (message: CollisionToMain, transfer?: Transferable[]) => {
    scope.postMessage(message, transfer ?? [])
  },
})

scope.addEventListener('message', (event: MessageEvent<MainToCollision>) => {
  engine.handle(event.data)
})
