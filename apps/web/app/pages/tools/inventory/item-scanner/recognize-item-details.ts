import { TranslateFn } from './types'

export async function recognizeItemDetails(lines: string[], tl8: TranslateFn) {
  // clean lines from disturbing colons
  lines = cleanFromTooltipHints(lines, [
    tl8('ui_stat_magnify_tooltip'),
    tl8('perktooltips_stacks'),
    tl8('perktooltips_max_stacks'),
  ])

  // Find the rarity line index and use it to get entire item name
  const { rarity, rarityIndex } = findRarityLine(lines, [
    tl8('RarityLevel0_DisplayName'),
    tl8('RarityLevel1_DisplayName'),
    tl8('RarityLevel2_DisplayName'),
    tl8('RarityLevel3_DisplayName'),
    tl8('RarityLevel4_DisplayName'),
    tl8('ui_artifact'),
  ])

  // console.debug(JSON.stringify(lines, null, 2))
  let itemName = lines[0].trim()
  let itemType: string = null
  if (rarityIndex >= 0) {
    itemName = lines.slice(0, rarityIndex).join(' ').trim()
    itemType = lines[rarityIndex + 1].trim()
  }

  const gearScore: number = findGearScore(lines)
  // attributes names from text like "+26 Dexterity"
  const attrNames = lines.map((it) => it.match(/\+\s*\d+\s*(\w+)?/)?.[1]).filter((it) => !!it && !it.includes('%'))

  // perk names usually follow the pattern: "name: description"
  const perkNames = lines
    .filter((it) => it.includes(':'))
    .map((it) => it.split(':')[0]) // take only name
    .filter((it) => !!it) // remove empty lines

  return {
    name: itemName,
    type: itemType,
    rarity: rarity,
    attributes: attrNames,
    perks: perkNames,
    gearScore: gearScore,
  }
}

function findGearScore(lines: string[]) {
  for (let line of lines) {
    line = line.replace(/[^a-zA-Z0-9]/g, '')
    if (line.match(/^\d{3}$/)) {
      return parseInt(line, 10)
    }
  }
  return null
}

function findRarityLine(lines: string[], rarities: string[]) {
  let rarity: string = null
  let rarityIndex = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const rarityName of rarities) {
      if (line.toLocaleLowerCase().includes(rarityName.toLocaleLowerCase())) {
        if (!rarity || rarityName.length > rarity.length) {
          rarity = rarityName
          rarityIndex = i
        }
      }
    }
  }
  return { rarity, rarityIndex }
}

function cleanFromTooltipHints(lines: string[], tooltips: string[]) {
  tooltips = tooltips.map((tip) => {
    // find the word closest to a colon ':'
    const [left] = tip.split(':')
    const words = left.split(' ')
    const word = words[words.length - 1]
    return word
  })

  const result: string[] = []
  outer: for (const line of lines) {
    for (const tip of tooltips) {
      const index = line.toLocaleLowerCase().indexOf(tip.toLocaleLowerCase())
      if (index >= 0) {
        result.push(line.slice(0, index).trim())
        continue outer
      }
    }
    result.push(line)
  }
  return result
}
