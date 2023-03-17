export function walkJsonObjects(input: any, callback: (obj: Object) => void | boolean) {
  if (!input) {
    return
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      if (item) {
        walkJsonObjects(item, callback)
      }
    }
    return
  }
  if (typeof input === 'object') {
    if (callback(input)) {
      return
    }
    for (const key in input) {
      walkJsonObjects(input[key], callback)
    }
  }
}
