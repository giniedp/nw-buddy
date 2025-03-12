import { shareReplay } from 'rxjs'

export function shareReplayRefCount<T>(bufferSize?: number) {
  return shareReplay<T>({
    refCount: true,
    bufferSize: bufferSize,
  })
}
