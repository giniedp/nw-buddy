import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { uniq } from 'lodash'
import { Observable, combineLatest, defer, map, of, shareReplay, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { CaseInsensitiveMap, eqCaseInsensitive } from '~/utils'

export interface ItemModelInfo {
  itemId: string
  label: string
  url: string
  isMale?: boolean
  isFemale?: boolean
  isMesh?: boolean
}

export interface StatRow {
  itemId: string
  itemType: string
  model: string
  size: number
  tags: string[]
}

@Injectable({ providedIn: 'root' })
export class ModelViewerService {

  public constructor(private db: NwDbService) {
    //
  }

  public byItemId(itemId$: Observable<string>) {
    return this.db.item(itemId$).pipe(
      switchMap((item) => {
        return combineLatest([
          this.byAppearanceId(of(item.ArmorAppearanceM)),
          this.byAppearanceId(of(item.ArmorAppearanceF)),
          this.byAppearanceId(of(item.WeaponAppearanceOverride)),
        ])
      }),
      map(([armorM, armorF, weapon]) => {
        return [...armorM, ...armorF, ...weapon]
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
            url: new URL(it.url, 'https://cdn.nw-buddy.de').toString(),
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
      url: `/models/itemappearances/${item.ItemID.toLowerCase()}-${key.toLowerCase()}.gltf`,
      label: uniq([...tags, item.Gender, key].filter((it) => !!it)).join(' '),
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
        isMale: false,
        isFemale: false,
        isMesh: false,
        url: `/models/weaponappearances/${item.WeaponAppearanceID.toLowerCase()}-${key.toLowerCase()}.gltf`,
        label: uniq([...tags, key]).join(' '),
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
        isMale: false,
        isFemale: false,
        isMesh: false,
        url: `/models/instrumentappearances/${item.WeaponAppearanceID.toLowerCase()}-${key.toLowerCase()}.gltf`,
        label: uniq([...tags, key]).join(' '),
      })
    }
  }
  return result
}
