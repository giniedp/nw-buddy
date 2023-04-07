import { TrackByFunction } from "@angular/core";

export const trackByIndex: TrackByFunction<any> = (i) => i
export function trackById<T>(key: keyof T): TrackByFunction<T> {
  return (i, item) => item[key]
}
