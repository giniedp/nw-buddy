import { Observable } from "@babylonjs/core"

export type ObservablesOf<C> = Partial<{
  [P in keyof C]: C[P] extends Observable<infer T> ? C[P] : never
}>
export type ObservablesKeysOf<C> = keyof ObservablesOf<C>
export type ObservableValue<K extends ObservablesKeysOf<C>, C> = C[K] extends Observable<infer T> ? T : never
