import * as path from 'path'
import { glob, readJSONFile, writeJSONFile } from "../utils";
import { pathToDatatables } from "./loadDatatables";

export async function extractLootTags(inputDir: string, outDir: string) {
  const tablesDir = pathToDatatables(inputDir)
  const { tableIds, bucketIds } = await scanForTableIds(inputDir)

  function makeSet(list: string[]) {
    list = list.map((it) => it.trim()).filter((it) => !!it)
    return new Set(list)
  }
  const vitalTags = await readJSONFile<Array<{ LootTags: string }>>(path.join(tablesDir, 'javelindata_vitals.json'))
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const territoriesTags = await readJSONFile<Array<{ LootTags: string }>>(
    path.join(tablesDir, 'javelindata_territorydefinitions.json')
  )
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const gameModeTags = await readJSONFile<Array<{ LootTags: string }>>(
    path.join(tablesDir, 'javelindata_gamemodes.json')
  )
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const mutationTags = await readJSONFile<Array<{ MutLootTagsOverride: string }>>(
    path.join(tablesDir, 'javelindata_gamemodes.json')
  )
    .then((list) => list.map((it) => it.MutLootTagsOverride?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const poiTags = await glob(path.join(tablesDir, 'pointofinterestdefinitions', '*.json'))
    .then((files) => {
      return Promise.all(files.map((file) => readJSONFile<Array<{ LootTags: string }>>(file)))
    })
    .then((list) => list.flat(1))
    .then((list) => list.map((it) => it.LootTags?.split(',') || []))
    .then((list) => makeSet(list.flat(1)))

  const lootBucketTags = await readJSONFile<Array<Record<string, string>>>(
    path.join(tablesDir, 'javelindata_lootbuckets.json')
  )
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

  const lootTableConditions = await glob([
    path.join(tablesDir, 'javelindata_loottables.json'),
    path.join(tablesDir, 'javelindata_loottables_*.json'),
  ])
    .then((files) => {
      return Promise.all(files.map((file) => readJSONFile<Array<{ LootTableID: string, Conditions: string }>>(file)))
    })
    .then((list) => list.flat(1))
    .then((list) => list.map((it) => {
      if (tableIds.has(it.LootTableID)) {
        return it.Conditions?.split(',') || []
      }
      return []
    }))
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
      unmapped: Array.from(all2.values()).filter((it) => !all1.has(it)).sort()
    },
    path.join(outDir, 'lootTags.json')
  )
}

async function scanForTableIds(inputDir: string) {
  const tableIds = new Set<string>()
  const bucketIds = new Set<string>()
  const tablesDir = pathToDatatables(inputDir)
  const files = await glob(path.join(tablesDir, '**', '*.json'))
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
    bucketIds
  }
}
