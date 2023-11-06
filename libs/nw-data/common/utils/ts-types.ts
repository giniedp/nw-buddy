export type KeysWithPrefix<T, P extends string> = T extends `${P}${string}` ? T : never
export type KeysWithoutPrefix<T, P extends string> = T extends `${P}${string}` ? never : T
export type PickByPrefix<T, P extends string> = {
  [K in keyof T as KeysWithPrefix<K, P>]: T[K]
}
export type OmitByPrefix<T, P extends string> = {
  [K in keyof T as KeysWithoutPrefix<K, P>]: T[K]
}
