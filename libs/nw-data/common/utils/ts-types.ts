

type WithPrefix<T, P extends string> = T extends `${P}${string}` ? T : never
type WithoutPrefix<T, P extends string> = T extends `${P}${string}` ? never : T

export type PickByPrefix<T, P extends string> = {
  [K in keyof T as WithPrefix<K, P>]: T[K]
}
export type OmitByPrefix<T, P extends string> = {
  [K in keyof T as WithoutPrefix<K, P>]: T[K]
}

export type KeysWithPrefix<T, P extends string> = keyof PickByPrefix<T, P>
export type KeysWithoutPrefix<T, P extends string> = keyof OmitByPrefix<T, P>
