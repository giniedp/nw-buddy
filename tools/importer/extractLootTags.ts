import { FileContext, fileContext, readJSONFile, writeJSONFile } from '../utils'

import { z } from 'zod'
import {
  GameModesTableSchema,
  POIDefinitionTableSchema,
  TerritoriesTableSchema,
  VitalsTableSchema,
} from './tables/schemas'

//z.object({ LootTags: z.string() })

export async function extractLootTags({ tablesDir, outFile }: { tablesDir: string; outFile: string }) {
  const ctx = fileContext(tablesDir)
  const { tableIds, bucketIds } = await scanForTableIds(ctx)

  function makeSet(list: string[]) {
    list = list.map((it) => it.trim()).filter((it) => !!it)
    return new Set(list)
  }
  const vitalTags = await readJSONFile(ctx.path('javelindata_vitals.json'), VitalsTableSchema)
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const territoriesTags = await readJSONFile(ctx.path('javelindata_territorydefinitions.json'), TerritoriesTableSchema)
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const gameModeTags = await readJSONFile(ctx.path('javelindata_gamemodes.json'), GameModesTableSchema)
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const mutationTags = await readJSONFile(ctx.path('javelindata_gamemodes.json'), GameModesTableSchema)
    .then((list) => list.map((it) => it.MutLootTagsOverride?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const poiTags = await ctx
    .glob(['pointofinterestdefinitions/*.json'])
    .then((files) => Promise.all(files.map((file) => readJSONFile(file, POIDefinitionTableSchema))))
    .then((list) => list.flat(1))
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const lootBucketTags = await readJSONFile<Array<Record<string, string>>>(ctx.path('javelindata_lootbuckets.json'))
    .then((list) => {
      return list
        .map((bucket) => {
          return Object.entries(bucket).map(([key, value]) => {
            if (key.startsWith('Tags')) {
              const bucketName = key.replace('Tags', 'LootBucket')
              if (bucketIds.has(bucketName)) {
                return value.split(',')
              }
              return []
            }
            return []
          })
        })
        .flat(1)
    })
    .then((list) => makeSet(list.flat(1)))

  const lootTableConditions = await ctx
    .glob(['javelindata_loottables.json', 'javelindata_loottables_*.json'])
    .then((files) => {
      return Promise.all(
        files.map((file) =>
          readJSONFile(
            file,
            z.array(
              z.object({
                LootTableID: z.string(),
                Conditions: z.string(),
              })
            )
          )
        )
      )
    })
    .then((list) => list.flat(1))
    .then((list) =>
      list.map((it) => {
        if (tableIds.has(it.LootTableID)) {
          return it.Conditions?.split(',') || []
        }
        return []
      })
    )
    .then((list) => makeSet(list.flat(1)))

  const all1 = makeSet(
    [vitalTags, territoriesTags, gameModeTags, mutationTags, poiTags]
      .map((it) => Array.from(it.values()))
      .flat(1)
      .map((it) => it.toLowerCase())
  )

  const all2 = makeSet(
    [lootBucketTags, lootTableConditions]
      .map((it) => Array.from(it.values()))
      .flat(1)
      .map((it) => it.split(':')[0])
      .map((it) => it.toLowerCase())
  )

  await writeJSONFile(
    {
      vitalTags: Array.from(vitalTags.values()).sort(),
      territoriesTags: Array.from(territoriesTags.values()).sort(),
      gameModeTags: Array.from(gameModeTags.values()).sort(),
      mutationTags: Array.from(mutationTags.values()).sort(),
      poiTags: Array.from(poiTags.values()).sort(),
      lootBucketTags: Array.from(lootBucketTags.values()).sort(),
      lootTableConditions: Array.from(lootTableConditions.values()).sort(),
      unmapped: Array.from(all2.values())
        .filter((it) => !all1.has(it))
        .sort(),
    },
    {
      target: outFile,
    }
  )
}

async function scanForTableIds(ctx: FileContext) {
  const tableIds = new Set<string>()
  const bucketIds = new Set<string>()
  const files = await ctx.glob(['**/*.json'])
  for (const file of files) {
    const data = await readJSONFile<Array<Record<string, any>>>(file)
    for (const item of data) {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value !== 'string') {
          return
        }
        if (value.startsWith('[LBID]')) {
          bucketIds.add(value.replace('[LBID]', ''))
        }
        if (value.startsWith('[LTID]')) {
          tableIds.add(value.replace('[LTID]', ''))
        }
      })
    }
  }
  return {
    tableIds,
    bucketIds,
  }
}
