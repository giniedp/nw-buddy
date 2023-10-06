import { VitalsFamily, Vitals } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwDbService } from '~/nw'

export function vitalForFamily(family: VitalsFamily, db: NwDbService) {
  return db.vitalsByFamily
    .pipe(map((it) => it.get(family)))
    .pipe(
      map((vitals): Partial<Vitals> => {
        return {
          Family: family,
          ...mostCommonProps(vitals, [
            'ABSArcane',
            'ABSCorruption',
            'ABSFire',
            'ABSIce',
            'ABSLightning',
            'ABSNature',

            'ABSSiege',
            'ABSSlash',
            'ABSStandard',
            'ABSStrike',
            'ABSThrust',

            'WKNArcane',
            'WKNCorruption',
            'WKNFire',
            'WKNIce',
            'WKNLightning',
            'WKNNature',

            'WKNSiege',
            'WKNSlash',
            'WKNStandard',
            'WKNStrike',
            'WKNThrust',
          ]),
        }
      })
    )
    .pipe(map((it) => it as Vitals))
}

export function mergeVitals(family: VitalsFamily, vitals: Vitals[]): Partial<Vitals> {
  return {
    Family: family,
    ...mostCommonProps(vitals, [
      'ABSArcane',
      'ABSCorruption',
      'ABSFire',
      'ABSIce',
      'ABSLightning',
      'ABSNature',

      'ABSSiege',
      'ABSSlash',
      'ABSStandard',
      'ABSStrike',
      'ABSThrust',

      'WKNArcane',
      'WKNCorruption',
      'WKNFire',
      'WKNIce',
      'WKNLightning',
      'WKNNature',

      'WKNSiege',
      'WKNSlash',
      'WKNStandard',
      'WKNStrike',
      'WKNThrust',
    ]),
  }
}

function mostCommonProps<T>(data: T[], k: Array<keyof T>): Partial<T> {
  const map = new Map<
    string,
    {
      count: number
      value: Partial<T>
    }
  >()

  for (const item of data) {
    const values = k.map((it) => item[it])
    if (values.every((it) => !it)) {
      continue
    }
    const key = values.map((it) => it || '').join('-')
    if (!map.has(key)) {
      map.set(key, {
        count: 0,
        value: k.reduce((prev, lookup) => {
          prev[lookup] = item[lookup]
          return prev
        }, {} as Partial<T>),
      })
    }
    map.get(key).count += 1
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count)?.[0]?.value || {}
}
