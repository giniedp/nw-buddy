import path from 'path'
import { DatasheetFile } from '../../file-formats/datasheet/converter'
import { readJSONFile, withProgressBar } from '../../utils'
import { logger } from '../../utils/logger'

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
      // logger.debug('Added', added, 'Skipped', skipped)
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

function translate(dict: Record<string, string>, key: string) {
  if (!key) {
    return null
  }
  if (key.startsWith('@')) {
    key = key.slice(1)
  }
  key = key.toLowerCase()
  return dict[key]
}

export async function generateSearch({
  localeFiles,
  tablesFiles,
  onFileReady,
}: {
  localeFiles: string[]
  tablesFiles: string[]
  onFileReady: (locale: string, data: string) => Promise<void>
}) {
  const tables = await Promise.all(tablesFiles.map((it) => readJSONFile<DatasheetFile>(it)))
  await withProgressBar({ label: 'Indexing Search', tasks: localeFiles }, async (locale, i, log) => {
    log(path.basename(locale, locale))
    const dict = await readJSONFile<Record<string, string>>(locale)
    const index = indexTable()
    await indexItems(dict, tables, index)
    await indexHousingItems(dict, tables, index)
    //await indexCrafting(dict, tables, index)
    await indexPerks(dict, tables, index)
    await indexAbilities(dict, tables, index)
    await indexStatusEffects(dict, tables, index)
    await indexPOI(dict, tables, index)
    await indexQuests(dict, tables, index)
    await indexVitals(dict, tables, index)
    await indexMounts(dict, tables, index)
    await indexAppearance(dict, tables, index)
    await indexWeaponAppearance(dict, tables, index)
    await indexTerritories(dict, tables, index)
    const data = index.getData()
    const json = ['[', data.map((it) => JSON.stringify(it)).join(',\n'), ']'].join('\n')
    await onFileReady(locale, json)
  })
}

async function indexItems(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'MasterItemDefinitions')
  if (!tables.length) {
    logger.warn('No item tables found')
  }
  type ItemType = { ItemID: string; Name: string; IconPath: string; Tier: number }
  for (const table of tables) {
    const isNamed = table.header.name === 'MasterItemDefinitions_Named'
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.ItemID,
        type: 'item',
        text: translate(dict, item.Name) || '',
        icon: item.IconPath,
        named: isNamed,
        rarity: getItemRarity(item),
        tier: item.Tier,
        gs: getItemGearScoreLabel(item),
      })
    }
  }
}

async function indexHousingItems(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.name === 'HouseItems' || it.header.name === 'HouseItemsMTX')
  if (!tables.length) {
    logger.warn('No housing tables found')
  }

  type ItemType = { HouseItemID: string; Name: string; IconPath: string; Tier: number }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.HouseItemID,
        type: 'housing',
        text: translate(dict, item.Name) || '',
        icon: item.IconPath,
        tier: item.Tier,
        rarity: getItemRarity(item),
      })
    }
  }
}

async function indexCrafting(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'CraftingRecipeData')
  if (!tables.length) {
    logger.warn('No crafting tables found')
  }
  type ItemType = { RecipeID: string; RecipeNameOverride: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.RecipeID,
        type: 'crafting',
        text: translate(dict, item.RecipeNameOverride) || '',
        icon: null,
        rarity: null,
      })
    }
  }
}

async function indexPerks(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'PerkData')
  if (!tables.length) {
    logger.warn('No perk tables found')
  }
  type ItemType = { PerkID: string; DisplayName: string; SecondaryEffectDisplayName: string; IconPath: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.PerkID,
        type: 'perk',
        text: translate(dict, item.DisplayName) || translate(dict, item.SecondaryEffectDisplayName) || '',
        icon: item.IconPath,
      })
    }
  }
}

async function indexAbilities(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'AbilityData')
  if (!tables.length) {
    logger.warn('No ability tables found')
  }
  type ItemType = { AbilityID: string; DisplayName: string; Icon: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.AbilityID,
        type: 'ability',
        text: translate(dict, item.DisplayName) || '',
        icon: item.Icon,
      })
    }
  }
}

async function indexStatusEffects(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'StatusEffectData')
  if (!tables.length) {
    logger.warn('No ability tables found')
  }
  type ItemType = { StatusID: string; DisplayName: string; PlaceholderIcon: string; IconPath: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.StatusID,
        type: 'statuseffect',
        text: translate(dict, item.DisplayName) || '',
        icon: item.IconPath || item.PlaceholderIcon,
      })
    }
  }
}

async function indexPOI(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'TerritoryDefinition')
  if (!tables.length) {
    logger.warn('No territory tables found')
  }
  type ItemType = { TerritoryID: string; NameLocalizationKey: string; MapIcon: string; CompassIcon: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.TerritoryID,
        type: 'zone',
        text: translate(dict, item.NameLocalizationKey) || '',
        icon: item.MapIcon || item.CompassIcon,
      })
    }
  }
}

async function indexQuests(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'Objectives')
  if (!tables.length) {
    logger.warn('No quest tables found')
  }
  type ItemType = { ObjectiveID: string; Title: string; Type: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.ObjectiveID,
        type: 'quest',
        subType: item.Type,
        text: translate(dict, item.Title) || '',
        icon: '',
      })
    }
  }
}

async function indexVitals(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'VitalsBaseData')
  if (!tables.length) {
    logger.warn('No vitals tables found')
  }
  type ItemType = { VitalsID: string; DisplayName: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      index.add({
        id: item.VitalsID,
        type: 'vital',
        text: translate(dict, item.DisplayName) || '',
        icon: '',
      })
    }
  }
}

async function indexMounts(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'MountData')
  if (!tables.length) {
    logger.warn('No mount tables found')
  }
  type ItemType = { MountId: string; DisplayName: string; IconPath: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      if (item.DisplayName) {
        index.add({
          id: item.MountId,
          type: 'mount',
          text: translate(dict, item.DisplayName) || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexAppearance(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'ArmorAppearanceDefinitions')
  if (!tables.length) {
    logger.warn('No armor appearance tables found')
  }
  type ItemType = { ItemID: string; Name: string; IconPath: string; ItemClass: string[] }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      if (item.Name && item.ItemClass?.length > 0) {
        index.add({
          id: item.ItemID,
          type: 'appearance',
          subType: 'gear',
          text: translate(dict, item.Name) || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexWeaponAppearance(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'WeaponAppearanceDefinitions')
  if (!tables.length) {
    logger.warn('No weapon appearance tables found')
  }
  type ItemType = { WeaponAppearanceID: string; Name: string; IconPath: string }
  for (const table of tables) {
    const isInstrument = table.header.name === 'InstrumentsAppearanceDefinitions'
    for (const item of table.rows as ItemType[]) {
      if (item.Name) {
        index.add({
          id: item.WeaponAppearanceID,
          type: 'appearance',
          subType: isInstrument ? 'instrument' : 'weapon',
          text: translate(dict, item.Name) || '',
          icon: item.IconPath,
        })
      }
    }
  }
}

async function indexTerritories(dict: Record<string, string>, tables: DatasheetFile[], index: IndexTable) {
  tables = tables.filter((it) => it.header.type === 'TerritoryDefinition')
  if (!tables.length) {
    logger.warn('No territory tables found')
  }
  type ItemType = { TerritoryID: string; NameLocalizationKey: string; MapIcon: string }
  for (const table of tables) {
    for (const item of table.rows as ItemType[]) {
      if (!item.NameLocalizationKey) {
        continue
      }
      index.add({
        id: String(item.TerritoryID) ,
        type: 'poi',
        text: translate(dict, item.NameLocalizationKey) || '',
        icon: item.MapIcon,
      })
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
