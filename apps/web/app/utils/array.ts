export function removeFromArray<T>(list: T[], item: T) {
  const index = list.indexOf(item)
  if (index >= 0) {
    list.splice(index, 1)
    return true
  }
  return false
}

export function addToArraySet<T>(set: T[], item: T) {
  const index = set.indexOf(item)
  if (index === -1) {
    set.push(item)
    return true
  }
  return false
}

export function appendToArray<T>(list: T[] | null, item: T) {
  list = list || []
  list.push(item)
  return list
}
