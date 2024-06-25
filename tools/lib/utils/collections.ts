export function arrayAppend<T>(list: T[], item: T, equals: (a: T, b: T) => boolean = (a, b) => a === b): void {
  if (!list.some((it) => equals(it, item))) {
    list.push(item)
  }
}
