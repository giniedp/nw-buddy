
export interface GameFs {
  stats: (path: string) => Promise<any>
  readFile: (path: string) => Promise<Buffer>
  glob: (pattern: string | string[]) => Promise<string[]>
}
