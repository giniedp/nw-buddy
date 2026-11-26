/// <reference lib="webworker" />
import { VgmstreamDecoder } from './decoder'
import { AudioEngine } from './engine'
import { publicAssetUrl } from '../../content/publicAssets'
import type { MainToWorker, WorkerToMain } from './protocol'

const scope = self as unknown as DedicatedWorkerGlobalScope

const engine = new AudioEngine({
  post: (message: WorkerToMain, transfer?: Transferable[]) => scope.postMessage(message, transfer ?? []),
  loadDecoder: () => VgmstreamDecoder.load(publicAssetUrl('vendor/vgmstream/')),
})

scope.addEventListener('message', (event: MessageEvent<MainToWorker>) => {
  engine.handle(event.data)
})
