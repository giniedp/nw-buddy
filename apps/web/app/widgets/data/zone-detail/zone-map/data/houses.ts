import { describeNodeSize, getGatherableNodeSizes, getZoneName } from '@nw-data/common'
import { TerritoryDefinition } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDataService } from '~/data'
import { TranslateService } from '~/i18n'
import { stringToColor } from '~/utils'
import { HouseFeature, HouseFeatureCollection } from './types'

export type MapCoord = (coord: number[] | [number, number]) => number[]

export function loadHouses(db: NwDataService, tl8: TranslateService, mapCoord: MapCoord) {
  const mapName = (territory: TerritoryDefinition) => tl8.get(getZoneName(territory))
  return combineLatest({
    locale: tl8.locale.value$,
    houseTypes: db.houseTypes,
    metaMap: db.houseTypesMetaMap,
  }).pipe(
    map(({ houseTypes, metaMap }) => {
      const result: HouseFeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      }
      for (const houseType of houseTypes) {
        const meta = metaMap.get(houseType.HouseTypeID)
        if (!meta) {
          continue
        }
        const tier = Number(houseType.HouseTypeID.match(/\d+/)[0])
        const size = describeNodeSize(getGatherableNodeSizes()[tier])
        const feature: HouseFeature = {
          type: 'Feature',
          properties: {
            id: houseType.HouseTypeID,
            label: `T${tier}`,
            color: size.color,
            size: size.scale * 3,
          },
          geometry: {
            type: 'MultiPoint',
            coordinates: [],
          },
        }
        result.features.push(feature)

        for (const house of meta.houses) {
          feature.geometry.coordinates.push(mapCoord(house.position))
        }
      }
      return result
    }),
  )
}
