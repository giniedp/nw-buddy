import { StatusEffectCategoryData } from '@nw-data/generated'
import { sortBy } from 'lodash'

const baseValues = {
  DMGStandard: 1,
  DMGSiege: 1,
  DMGStrike: 1,
  DMGSlash: 1,
  DMGThrust: 1,
  DMGArcane: 1,
  DMGFire: 1,
  DMGIce: 1,
  DMGNature: 1,
  DMGLightning: 1,
  DMGCorruption: 1,
  DMGAcid: 1,
}

export type ValueLimits = Record<string, number>
export function selectLimitsTable(category: StatusEffectCategoryData, categories: StatusEffectCategoryData[]) {
  if (!category) {
    return null
  }
  const rows = Object.keys(extractLimits(category.ValueLimits) || {})
  if (!rows.length) {
    return null
  }

  const cols: string[] = []
  const data: Record<string, Record<string, number>> = {}
  for (const category of categories || []) {
    const limits = extractLimits(category.ValueLimits)
    if (!limits) {
      continue
    }
    for (const row of rows) {
      if (limits[row] == null) {
        continue
      }
      if (!data[row]) {
        data[row] = {}
      }
      const col = category.StatusEffectCategoryID
      data[row][col] = limits[row] - (baseValues[row] || 0)
      if (!cols.includes(col)) {
        cols.push(col)
      }
    }
  }

  return {
    rows: rows,
    cols: sortBy(cols, (cat) => data[rows[0]][cat]),
    data: data,
  }
}

export function extractLimits(value: unknown): ValueLimits {
  if (!value) {
    return null
  }
  if (typeof value === 'object') {
    return value as ValueLimits
  }
  if (typeof value === 'string') {
    return Object.fromEntries(
      value.split(',').map((it) => {
        const [key, value] = it.split(':')
        return [key, Number(value)]
      }),
    )
  }

  return null
}
