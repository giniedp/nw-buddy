export function clipCount(count: number): string {
  return count === 1 ? '1 animation' : `${count} animations`
}

export function fileName(path: string) {
  return path.split('/').pop() ?? path
}
