import { Injectable } from '@angular/core'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'

export interface ItemModelInfo {
  itemId: string
  label: string
  url: string
  itemClass: string[]
}

export interface StatRow {
  itemId: string
  itemType: string
  model: string
  size: number
  tags: string[]
}

const NW_CDN_HOST = 'https://cdn.nw-buddy.de'
//const NW_CDN_HOST = 'http://localhost:9000/'

@Injectable({ providedIn: 'root' })
export class ModelViewerService {
  public constructor(private db: NwDbService) {
    //
  }

  public byItemId(itemId$: Observable<string>) {
    return combineLatest({
      master: this.byMasterItemId(itemId$),
      housing: this.byHousingItemid(itemId$),
    }).pipe(
      map(({ housing, master }) => {
        if (housing) {
          return [housing]
        }
        if (master?.length) {
          return master
        }
        return null
      })
    )
  }

  public byMasterItemId(itemId$: Observable<string>) {
    return this.db.item(itemId$).pipe(
      switchMap((item) => {
        return combineLatest([
          this.byAppearanceId(of(item?.ArmorAppearanceM)),
          this.byAppearanceId(of(item?.ArmorAppearanceF)),
          this.byAppearanceId(of(item?.WeaponAppearanceOverride)),
        ])
      }),
      map(([armorM, armorF, weapon]) => {
        return [...armorM, ...armorF, ...weapon]
      })
    )
  }

  public byHousingItemid(itemId$: Observable<string>) {
    return of(null)
    return this.db.housingItem(itemId$).pipe(
      map((item): ItemModelInfo => {
        if (!item?.PrefabPath) {
          return null
        }

        return {
          itemClass: [item['HousingTag1 Placed']].filter((it) => !!it),
          itemId: item.HouseItemID,
          label: item.Name,
          url: new URL('housingitems/' + item.PrefabPath + '.dynamicslice.glb', NW_CDN_HOST).toString().toLowerCase(),
        }
      })
    )
  }

  public byAppearanceId(appearanceId$: Observable<string>) {
    return combineLatest({
      item: this.db.itemAppearance(appearanceId$).pipe(map((it) => selectItemModels(it))),
      weapon: this.db.weaponAppearance(appearanceId$).pipe(map((it) => selectWeaponModels(it))),
      weaponMale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.Appearance)),
        map((it) => selectItemModels(it, ['Male']))
      ),
      weaponFemale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.FemaleAppearance)),
        map((it) => selectItemModels(it, ['Female']))
      ),
      instrument: this.db.instrumentAppearance(appearanceId$).pipe(map((it) => selectInstrumentModels(it))),
    }).pipe(
      map(({ item, weapon, weaponMale, weaponFemale, instrument }) => {
        return [...item, ...weaponMale, ...weaponFemale, ...weapon, ...instrument]
      }),
      map((list) => {
        return list.map((it) => {
          return {
            ...it,
            url: new URL(it.url, NW_CDN_HOST).toString(),
          }
        })
      })
    )
  }

  public byVitalsId(vitalsId$: Observable<string>) {
    return this.db.vitalsMeta(vitalsId$).pipe(
      map((meta) => {
        const files = meta?.models?.filter((it) => it.startsWith('slices/characters/'))
        if (!files?.length) {
          return null
        }
        return files.map((file, i): ItemModelInfo => {
          return {
            label: `Model ${i + 1}`,
            url: new URL(file, 'http://localhost:9000/').toString(),
            itemClass: [],
            itemId: meta.vitalsID,
          }
        })
      })
    )
  }
}

function selectItemModels(item: Itemappearancedefinitions, tags: string[] = []): ItemModelInfo[] {
  const result: ItemModelInfo[] = []
  if (!item) {
    return result
  }
  const keys: Array<keyof Itemappearancedefinitions> = ['Skin1', 'Skin2']
  for (const key of keys) {
    if (!item[key]) {
      continue
    }
    result.push({
      itemId: item.ItemID,
      url: `/models/itemappearances/${item.ItemID}-${key}.gltf`.toLowerCase(),
      label: uniq([...tags, item.Gender, key].filter((it) => !!it)).join(' '),
      itemClass: [...(item.ItemClass || [])],
    })
  }
  return result
}

function selectWeaponModels(item: ItemdefinitionsWeaponappearances, tags: string[] = []): ItemModelInfo[] {
  const result: ItemModelInfo[] = []
  if (!item) {
    return result
  }
  const keys: Array<keyof ItemdefinitionsWeaponappearances> = [
    'SkinOverride1',
    'SkinOverride2',
    'SkinOverride4',
    'MeshOverride',
  ]
  for (const key of keys) {
    if (item[key]) {
      result.push({
        itemId: item.WeaponAppearanceID,
        url: `/models/weaponappearances/${item.WeaponAppearanceID}-${key}.gltf`.toLowerCase(),
        label: uniq([...tags, key]).join(' '),
        itemClass: [...(item.ItemClass || [])],
      })
    }
  }
  return result
}

function selectInstrumentModels(item: ItemdefinitionsInstrumentsappearances, tags: string[] = []): ItemModelInfo[] {
  const result: ItemModelInfo[] = []
  if (!item) {
    return result
  }
  const keys: Array<keyof ItemdefinitionsInstrumentsappearances> = ['MeshOverride']
  for (const key of keys) {
    if (item[key]) {
      result.push({
        itemId: item.WeaponAppearanceID,
        url: `/models/instrumentappearances/${item.WeaponAppearanceID}-${key}.gltf`.toLowerCase(),
        label: uniq([...tags, key]).join(' '),
        itemClass: [...(item.ItemClass || [])],
      })
    }
  }
  return result
}
