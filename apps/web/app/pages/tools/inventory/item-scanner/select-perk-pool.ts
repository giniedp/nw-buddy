import { NW_MAX_GEAR_SCORE, explainPerkMods, isPerkInherent } from '@nw-data/common'
import { AffixStatData, PerkData } from '@nw-data/generated'
import { PoolPerk, TranslateFn } from './types'

export function selectPerkPool({
  perksMap,
  affixMap,
  tl8,
}: {
  perksMap: Map<string, PerkData>
  affixMap: Map<string, AffixStatData>
  tl8: TranslateFn
}) {
  const perkList = Array.from(perksMap.values()).map((it) => getPerkData(it, affixMap, tl8))
  const perksAttrs = perkList.filter((it) => isPerkInherent(it.perk))
  const perksOther = perkList.filter((it) => !isPerkInherent(it.perk))
  return {
    attributes: perksAttrs,
    perksAndGems: perksOther,
  }
}

function getPerkData(perk: PerkData, affixMap: Map<string, AffixStatData>, tl8: TranslateFn): PoolPerk {
  return {
    name: tl8(perk.DisplayName),
    prefix: perk.AppliedPrefix ? tl8(perk.AppliedPrefix) : null, // Arboreal ...
    suffix: perk.AppliedSuffix ? tl8(perk.AppliedSuffix) : null, // ... of the Ranger
    perk: perk,
    mods: !isPerkInherent(perk)
      ? null
      : explainPerkMods({
          perk: perk,
          affix: affixMap.get(perk.Affix),
          gearScore: NW_MAX_GEAR_SCORE,
        })
          .map((it) => ({
            label: tl8(it.description),
            value: it.label,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
  }
}
