import { Injectable } from '@angular/core'
import { ArmorAppearanceDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { humanize } from '~/utils'
import {
  costumeModelUri,
  femaleModelUri,
  housingItemModelUri,
  itemAppearanceModelUri,
  maleModelUri,
  mountModelUri,
  vitalModelUri,
  weaponAppearanceModelUri,
} from './utils/get-model-uri'

export interface ModelItemInfo {
  name: string
  itemId: string
  label: string
  itemClass: string[]
  url: string
  rootUrl?: string
  appearance: any
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private db = injectNwData()

  public playerMaleModel(): ModelItemInfo {
    return {
      name: 'Player',
      itemClass: [],
      itemId: null,
      label: 'Player',
      url: maleModelUri(),
      appearance: null,
    }
  }

  public playerFemaleModel(): ModelItemInfo {
    return {
      name: 'Player',
      itemClass: [],
      itemId: null,
      label: 'Player',
      url: femaleModelUri(),
      appearance: null,
    }
  }

  public byItemId(itemId$: Observable<string>) {
    return combineLatest({
      master: this.byMasterItemId(itemId$),
      housing: this.byHousingItemId(itemId$),
    }).pipe(
      map(({ housing, master }) => {
        if (housing) {
          return [housing]
        }
        if (master?.length) {
          return master
        }
        return null
      }),
    )
  }

  public byMasterItemId(itemId$: Observable<string>) {
    return itemId$.pipe(
      switchMap((id) => this.db.itemsById(id)),
      switchMap((item) => {
        return combineLatest([
          this.byAppearanceId(of(item?.ArmorAppearanceM)),
          this.byAppearanceId(of(item?.ArmorAppearanceF)),
          this.byAppearanceId(of(item?.WeaponAppearanceOverride)),
        ])
      }),
      map(([armorM, armorF, weapon]) => {
        return [...armorM, ...armorF, ...weapon]
      }),
    )
  }

  public byHousingItemId(itemId$: Observable<string>) {
    return itemId$.pipe(
      switchMap((id) => this.db.housingItemsById(id)),
      map((item): ModelItemInfo => {
        const uri = housingItemModelUri(item)
        if (!uri) {
          return null
        }
        return {
          name: item.Name,
          itemClass: item['HousingTag1 Placed'].filter((it) => !!it),
          itemId: item.HouseItemID,
          label: item.Name,
          url: uri,
          appearance: null,
        }
      }),
    )
  }

  public byAppearanceId(appearanceId$: Observable<string>) {
    return appearanceId$
      .pipe(
        switchMap((id) => {
          return combineLatest({
            item: from(this.db.armorAppearancesById(id)).pipe(map((it) => this.selectItemModels(it))),
            weapon: from(this.db.weaponAppearancesById(id)).pipe(map((it) => this.selectWeaponModels(it))),
            weaponMale: from(this.db.weaponAppearancesById(id)).pipe(
              switchMap((it) => this.db.armorAppearancesById(it?.Appearance)),
              map((it) => this.selectItemModels(it)),
            ),
            weaponFemale: from(this.db.weaponAppearancesById(id)).pipe(
              switchMap((it) => this.db.armorAppearancesById(it?.FemaleAppearance)),
              map((it) => this.selectItemModels(it)),
            ),
            mountAttachment: from(this.db.mountAttachmentsAppearancesById(id)).pipe(
              map((it) => this.selectWeaponModels(it)),
            ),
            instrument: from(this.db.instrumentAppearancesById(id)).pipe(map((it) => this.selectInstrumentModels(it))),
          })
        }),
      )
      .pipe(
        map(({ item, weapon, weaponMale, weaponFemale, mountAttachment, instrument }) => {
          return [
            ...item,
            //...weaponMale,
            //...weaponFemale,
            ...weapon,
            ...mountAttachment,
            ...instrument,
          ]
        }),
      )
  }

  public byVitalsId(vitalsId$: Observable<string>) {
    return vitalsId$
      .pipe(
        switchMap((id) => {
          return combineLatest({
            vital: this.db.vitalsById(id),
            meta: this.db.vitalsMetadataById(id),
            modelsMap: this.db.vitalsModelsMetadataByIdMap(),
          })
        }),
      )
      .pipe(
        map(({ meta, modelsMap, vital }) => {
          const models = meta?.models?.map((it) => vitalModelUri(it, modelsMap))?.filter((it) => !!it)
          if (!models?.length) {
            return null
          }
          return models.map((model, i): ModelItemInfo => {
            return {
              name: vital?.DisplayName,
              label: `Model ${i + 1}`,
              url: model,
              itemClass: [],
              itemId: meta.vitalsID,
              appearance: null,
            }
          })
        }),
      )
  }

  public byMountId(mountId$: Observable<string>) {
    return mountId$.pipe(switchMap((id) => this.db.mountsById(id))).pipe(
      map((mount): ModelItemInfo[] => {
        const uri = mountModelUri(mount)
        if (!uri) {
          return null
        }
        return [
          {
            name: mount.DisplayName,
            label: `Model`,
            url: uri,
            itemClass: [],
            itemId: mount.MountId,
            appearance: mount,
          },
        ]
      }),
    )
  }

  public byCostumeId(costumeId$: Observable<string>) {
    return costumeId$.pipe(switchMap((id) => this.db.costumeChangesById(id))).pipe(
      map((value): ModelItemInfo[] => {
        const uri = costumeModelUri(value)
        if (!uri) {
          return null
        }
        return [
          {
            name: humanize(value.CostumeChangeId),
            label: `Model`,
            url: uri,
            itemClass: [],
            itemId: value.CostumeChangeId,
            appearance: null,
          },
        ]
      }),
    )
  }

  public byNpcId(npcId$: Observable<string>) {
    // TODO: add support for npc variations
    return of([])
    // return this.db.npcsVariationsByNpcId(npcId$).pipe(
    //   map((it) => Array.from(it ?? [])),
    //   map((list): ItemModelInfo[] => {
    //     return list
    //       .filter((it) => !!it.CharacterDefinition)
    //       .map((it): ItemModelInfo => {
    //         return {
    //           name: humanize(it.VariantID),
    //           itemId: it.VariantID,
    //           label: 'Model',
    //           itemClass: [],
    //           url: `${this.cdnHost || ''}/npcs/${it.VariantID}-CharacterDefinition.glb`.toString().toLowerCase(),
    //         }
    //       })
    //   }),
    // )
  }

  private selectItemModels(item: ArmorAppearanceDefinitions): ModelItemInfo[] {
    const result: ModelItemInfo[] = []
    if (item?.Skin1) {
      result.push({
        name: item.Name,
        itemId: item.ItemID,
        url: itemAppearanceModelUri(item, 'Skin1'),
        label: item.Gender || 'Skin',
        itemClass: [...(item.ItemClass || [])],
        appearance: item,
      })
    }
    // if (item?.ShortsleeveChestSkin) {
    //   result.push({
    //     name: item.Name,
    //     itemId: item.ItemID,
    //     url: itemAppearanceModelUri(item, 'ShortsleeveChestSkin'),
    //     label: [item.Gender, 'Short sleeve'].filter((it) => !!it).join(' '),
    //     itemClass: [...(item.ItemClass || [])],
    //     appearance: item,
    //   })
    // }
    return result
  }

  private selectWeaponModels(
    item: WeaponAppearanceDefinitions, // | ItemdefinitionsWeaponappearancesMountattachments,
  ): ModelItemInfo[] {
    const result: ModelItemInfo[] = []
    if (!item?.MeshOverride) {
      return result
    }
    result.push({
      name: item.Name,
      itemId: item.WeaponAppearanceID,
      url: weaponAppearanceModelUri(item, 'MeshOverride'),
      label: 'Model',
      itemClass: [...(item.ItemClass || [])],
      appearance: item,
    })
    return result
  }

  private selectInstrumentModels(item: WeaponAppearanceDefinitions): ModelItemInfo[] {
    const result: ModelItemInfo[] = []
    if (!item?.MeshOverride) {
      return result
    }
    result.push({
      name: item.Name,
      itemId: item.WeaponAppearanceID,
      url: weaponAppearanceModelUri(item, 'MeshOverride'),
      label: 'Model',
      itemClass: [...(item.ItemClass || [])],
      appearance: item,
    })
    return result
  }

  private selectMountAttachmentsModels(item: WeaponAppearanceDefinitions): ModelItemInfo[] {
    const result: ModelItemInfo[] = []
    if (!item) {
      return result
    }
    result.push({
      name: item.Name,
      itemId: item.WeaponAppearanceID,
      url: weaponAppearanceModelUri(item, 'MeshOverride'),
      label: 'Model',
      itemClass: [...(item.ItemClass || [])],
      appearance: item,
    })
    return result
  }
}
