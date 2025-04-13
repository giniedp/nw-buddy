import { LevelData, LevelMetadata, RegionMetadata } from './types'

export interface LoadLevelOptions {
  rootUrl: string
  levelName: string
  fetch: typeof fetch
}

export async function loadLevelData(options: LoadLevelOptions): Promise<LevelData> {
  const baseUrl = `${options.rootUrl}/level/${options.levelName}`
  const meta: LevelMetadata = await options.fetch(baseUrl).then((it) => it.json())

  const regions = await Promise.all(
    meta.regions.map(async ({ location, name }): Promise<RegionMetadata> => {
      return options.fetch(`${baseUrl}/region/${name}`).then((it) => it.json())
    }),
  )

  const heightmap = await options.fetch(`${baseUrl}/heightmap`).then((it) => it.json())
  return {
    meta,
    regions,
    heightmap,
  }
}
