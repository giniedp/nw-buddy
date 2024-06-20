import type { AffixStatData } from '@nw-data/generated'

export function isAffixSplitDamage(affix: AffixStatData): boolean {
  return !!affix?.DamagePercentage && !!affix?.DamageType
}

export function getAffixMODs(affix: Partial<AffixStatData>, scale: number = 1) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('MOD'))
    .map(({ key, value }) => ({ key, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .map(({ key, value }) => {
      const label = key.replace('MOD', '').toLowerCase()
      return {
        key: key,
        label: `ui_${label}`,
        labelShort: `ui_${label}_short`,
        value: value * scale,
      }
    })
}

export function getAffixABSs(affix: Partial<AffixStatData>, scale: number) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('ABS'))
    .map(({ key, value }) => {
      const name = key.replace('ABS', '')
      let label: string
      let type: string
      if (name.match(/^vitalscategory/i)) {
        type = name.replace(/^vitalscategory\s+/i, '')
        label = `VC_${type}`
      } else {
        type = name
        label = `${name}_DamageName`
      }
      const valNum = Number(value)
      return {
        key: key,
        type: type,
        label: [label, 'ui_resistance'],
        value: Number.isFinite(valNum) ? valNum * scale : value,
      }
    })
}

export function getAffixDMGs(affix: Partial<AffixStatData>, scale: number) {
  return getAffixProperties(affix)
    .filter((it) => it.key.startsWith('DMG'))
    .map(({ key, value }) => {
      const name = key.replace('DMG', '').toLowerCase()
      let label: string
      if (name.match(/^vitalscategory/i)) {
        label = `VC_${name.replace('vitalscategory ', '')}`
      } else {
        label = `${name}_DamageName`
      }
      const valNum = Number(value)
      return {
        key: key,
        label: [label],
        value: Number.isFinite(valNum) ? valNum * scale : value,
      }
    })
}
export function getAffixProperties(affix: Partial<AffixStatData>): Array<{ key: string; value: number | string }> {
  return Object.entries((affix || {}) as AffixStatData)
    .filter(([key]) => key !== 'StatusID')
    .map(([key, value]) => {
      if (typeof value === 'string') {
        if (value.includes('=')) {
          const [a, b] = value.split('=')
          key = `${key} ${a}`
          value = Number(b)
        }
      }
      return {
        key,
        value,
      }
    })
    .filter((it) => !!it.value)
}

export function stripAffixProperties(item: AffixStatData): Partial<AffixStatData> {
  return Object.entries(item || {})
    .filter(([key, value]) => key !== 'StatusID' && key !== '$source' && !!value)
    .reduce((it, [key, value]) => {
      it[key] = value
      return it
    }, {})
}

export function hasAffixDamageConversion(item: AffixStatData) {
  return !!item?.DamagePercentage || !!item?.PreferHigherScaling
}
