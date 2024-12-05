

export type StartsWith<T, P extends string> = T extends `${P}${string}` ? T : never
export type StartsWithTrimmed<T, P extends string> = T extends `${P}${infer S}` ? S : never
export type StartsNotWith<T, P extends string> = T extends `${P}${string}` ? never : T

export type Equals<T, P extends string> = T extends `${P}` ? T : never

export type PickByPrefix<T, P extends string> = {
  [K in keyof T as StartsWith<K, P>]: T[K]
}
export type OmitByPrefix<T, P extends string> = {
  [K in keyof T as StartsNotWith<K, P>]: T[K]
}

export type KeysWithPrefix<T, P extends string> = keyof PickByPrefix<T, P>
export type KeysWithoutPrefix<T, P extends string> = keyof OmitByPrefix<T, P>


export type EndsWith<T, P extends string> = T extends `${string}${P}` ? T : never
export type EndsWithTrimmed<T, P extends string> = T extends `${infer S}${P}` ? S : never
export type EndsNotWith<T, P extends string> = T extends `${string}${P}` ? never : T

export type PickBySuffix<T, P extends string> = {
  [K in keyof T as EndsWith<K, P>]: T[K]
}
export type OmitBySuffix<T, P extends string> = {
  [K in keyof T as EndsNotWith<K, P>]: T[K]
}

export type KeysWithSuffix<T, P extends string> = keyof PickBySuffix<T, P>
export type KeysWithoutSuffix<T, P extends string> = keyof OmitBySuffix<T, P>
