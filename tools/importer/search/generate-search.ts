import * as path from 'path'
import { glob, readJSONFile, writeFile } from '../../utils'

const ITEM_RARITIES: string[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'artifact']
type IndexTable = ReturnType<typeof indexTable>
type IndexItem = {
  id: string
  type: string
  subType?: string
  text: string
  icon: string
  named?: boolean
  rarity?: string
  tier?: number
  gs?: string
}
function indexTable() {
  const records: IndexItem[] = []
  let added = 0
  let skipped = 0
  return {
    add: (record: IndexItem) => {
      if (record.text && record.id) {
        added++
        records.push(record)
      } else {
        skipped++
      }
    },
    getData: () => {
      console.log('Added', added, 'Skipped', skipped)
      return [...records].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type)
        }
        if (a.id !== b.id) {
          return String(a.id).localeCompare(String(b.id))
        }
        return a.text.localeCompare(b.text)
      })
    },
  }
}
export async function generateSearch(options: { localesDir: string; tablesDir: string; outDir: string }) {
  const locale = await loadLocales(options.localesDir)
  for (const item of locale) {
    console.log('Indexing', item.locale)
    const index = indexTable()
    await indexItems(item.dict, options.tablesDir, index)
    await indexHousingItems(item.dict, options.tablesDir, index)
    //await indexCrafting(item.dict, options.tablesDir, index)
    await indexPerks(item.dict, options.tablesDir, index)
    await indexAbilities(item.dict, options.tablesDir, index)
    await indexStatusEffects(item.dict, options.tablesDir, index)
    await indexPOI(item.dict, options.tablesDir, index)
    await indexQuests(item.dict, options.tablesDir, index)
    await indexVitals(item.dict, options.tablesDir, index)
    await indexMounts(item.dict, options.tablesDir, index)
    await indexAppearance(item.dict, options.tablesDir, index)
    await indexWeaponAppearance(item.dict, options.tablesDir, index)
    await indexInstrumentAppearance(item.dict, options.tablesDir, index)
    const data = index.getData()
    const json = [
      '[',
      data.map((it) => JSON.stringify(it)).join(',\n'),
      ']',
    ].join('\n')
    const file = path.join(options.outDir, `${item.locale}.json`)
    await writeFile(json, file, {
      createDir: true,
    })
  }
}

async function loadLocales(dir: string) {
  const files = await glob(path.join(dir, '**', '*.json'))
  return Promise.all(
    files.map(async (file) => {
      return {
        locale: path.basename(file, '.json'),
        dict: await readJSONFile<Record<string, string>>(file),
      }
    })
  )
}

async function indexItems(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([
    path.join(tablesDir, '**', '*_itemdefinitions_master_*.json'),
    path.join(tablesDir, '**', '*_itemdefinitions_mtx_*.json'),
  ])
  type ItemType = { ItemID: string; Name: string; IconPath: string; Tier: number }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    const isNamed = file.endsWith('_named.json')
    for (const item of table) {
      index.add({
        id: item.ItemID,
        type: 'item',
        text: dict[item.Name?.toLowerCase()] || '',
        icon: item.IconPath,
        named: isNamed,
        rarity: getItemRarity(item),
        tier: item.Tier,
        gs: getItemGearScoreLabel(item),
      })
    }
  }
}

async function indexHousingItems(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([
    path.join(tablesDir, '**', '*_housingitems.json'),
    path.join(tablesDir, '**', '*_housingitems_mtx.json'),
  ])
  type ItemType = { HouseItemID: string; Name: string; IconPath: string; Tier: number }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.HouseItemID,
        type: 'housing',
        text: dict[item.Name?.toLowerCase()] || '',
        icon: item.IconPath,
        tier: item.Tier,
        rarity: getItemRarity(item),
      })
    }
  }
}

// async function indexCrafting(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
//   const itemsTables = await glob([
//     path.join(tablesDir, '**', '*crafting.json'),
//   ])
//   type ItemType = { RecipeID: string; Name: string; IconPath: string }
//   for (const file of itemsTables) {
//     const table = await readJSONFile<Array<ItemType>>(file)
//     for (const item of table) {
//       index.add({
//         id: item.HouseItemID,
//         type: 'housing',
//         text: dict[item.Name] || '',
//         icon: item.IconPath,
//         rarity: 0,
//       })
//     }
//   }
// }

async function indexPerks(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_perks.json')])
  type ItemType = { PerkID: string; DisplayName: string; SecondaryEffectDisplayName: string; IconPath: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.PerkID,
        type: 'perk',
        text: dict[item.DisplayName?.toLowerCase()] || dict[item.SecondaryEffectDisplayName?.toLowerCase()] || '',
        icon: item.IconPath,
      })
    }
  }
}

async function indexAbilities(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', 'weaponabilities', '*_ability_*.json')])
  type ItemType = { AbilityID: string; DisplayName: string; Icon: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.AbilityID,
        type: 'ability',
        text: dict[item.DisplayName?.toLowerCase()] || '',
        icon: item.Icon,
      })
    }
  }
}

async function indexStatusEffects(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_statuseffects_*.json')])
  type ItemType = { StatusID: string; DisplayName: string; PlaceholderIcon: string; IconPath: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.StatusID,
        type: 'statuseffect',
        text: dict[item.DisplayName?.toLowerCase()] || '',
        icon: item.IconPath || item.PlaceholderIcon,
      })
    }
  }
}

async function indexPOI(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_poidefinitions_*.json')])
  type ItemType = { TerritoryID: string; NameLocalizationKey: string; MapIcon: string; CompassIcon: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.TerritoryID,
        type: 'poi',
        text: dict[item.NameLocalizationKey?.toLowerCase()] || '',
        icon: item.MapIcon || item.CompassIcon,
      })
    }
  }
}

async function indexQuests(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', 'quests', '**', '*.json')])
  type ItemType = { ObjectiveID: string; Title: string; Type: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.ObjectiveID,
        type: 'quest',
        subType: item.Type,
        text: dict[item.Title?.toLowerCase()] || '',
        icon: '',
      })
    }
  }
}

async function indexVitals(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([
    path.join(tablesDir, '**', '*_vitals_*.json'),
    path.join(tablesDir, '**', '*_vitals.json'),
  ])
  type ItemType = { VitalsID: string; DisplayName: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      index.add({
        id: item.VitalsID,
        type: 'vital',
        text: dict[item.DisplayName?.toLowerCase()] || '',
        icon: '',
      })
    }
  }
}

async function indexMounts(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_mounts.json')])
  type ItemType = { MountId: string; DisplayName: string; IconPath: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      if (item.DisplayName) {
        index.add({
          id: item.MountId,
          type: 'mount',
          text: dict[item.DisplayName?.toLowerCase()] || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexAppearance(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_itemappearancedefinitions.json')])
  type ItemType = { ItemID: string; Name: string; IconPath: string; ItemClass: string[] }

  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      if (item.Name && item.ItemClass?.length > 0) {
        index.add({
          id: item.ItemID,
          type: 'appearance',
          subType: 'gear',
          text: dict[item.Name?.toLowerCase()] || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexWeaponAppearance(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_weaponappearances.json')])
  type ItemType = { WeaponAppearanceID: string; Name: string; IconPath: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      if (item.Name) {
        index.add({
          id: item.WeaponAppearanceID,
          type: 'appearance',
          subType: 'weapon',
          text: dict[item.Name?.toLowerCase()] || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexInstrumentAppearance(dict: Record<string, string>, tablesDir: string, index: IndexTable) {
  const itemsTables = await glob([path.join(tablesDir, '**', '*_itemappearancedefinitions.json')])
  type ItemType = { WeaponAppearanceID: string; Name: string; IconPath: string }
  for (const file of itemsTables) {
    const table = await readJSONFile<Array<ItemType>>(file)
    // console.log('Indexing', file, table.length)
    for (const item of table) {
      if (item.Name) {
        index.add({
          id: item.WeaponAppearanceID,
          type: 'instrument',
          text: dict[item.Name?.toLowerCase()] || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

export function getItemRarity(item: any): string {
  if (!item) {
    return ITEM_RARITIES[0]
  }
  if (item.ForceRarity) {
    return ITEM_RARITIES[item.ForceRarity]
  }
  if (!item.ItemID) {
    return ITEM_RARITIES[0]
  }
  if (item.ItemClass?.includes('Artifact')) {
    return 'artifact'
  }

  const perkIds = [item.Perk1, item.Perk2, item.Perk3, item.Perk4, item.Perk5].filter((it) => !!it)

  let perkCount = perkIds.length
  if (perkCount <= 1) {
    return ITEM_RARITIES[0]
  }
  if (perkCount === 2) {
    return ITEM_RARITIES[1]
  }
  if (perkCount === 3) {
    return ITEM_RARITIES[2]
  }
  if (perkCount === 4) {
    return ITEM_RARITIES[3]
  }
  return ITEM_RARITIES[4]
}
export function getItemGearScoreLabel(item: any) {
  if (!item) {
    return ''
  }
  if (item.GearScoreOverride) {
    return String(item.GearScoreOverride)
  }
  if (item.MinGearScore && item.MaxGearScore) {
    return `${item.MinGearScore}-${item.MaxGearScore}`
  }
  return String(item.MaxGearScore || item.MinGearScore || '')
}
