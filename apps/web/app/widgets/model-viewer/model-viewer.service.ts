import { Injectable, inject } from '@angular/core'
import { ArmorAppearanceDefinitions, HouseItems, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { environment } from '~/../environments'
import { NwDataService } from '~/data'
import { AppPreferencesService } from '~/preferences'
import { humanize } from '~/utils'

export interface ItemModelInfo {
  name: string
  itemId: string
  label: string
  itemClass: string[]
  url: string
  appearance: any
}

@Injectable({ providedIn: 'root' })
export class ModelsService {
  private preferences = inject(AppPreferencesService)

  private get cdnHost() {
    if (this.preferences.highQualityModels.get()) {
      return environment.modelsUrlHigh
    }
    return environment.modelsUrlMid
  }

  public constructor(private db: NwDataService) {
    //
  }

  public playerMaleModel(): ItemModelInfo {
    return {
      name: 'Player',
      itemClass: [],
      itemId: null,
      label: 'Player',
      url: `${this.cdnHost || ''}/objects/characters/player/male/player_male.glb`.toString().toLowerCase(),
      appearance: null,
    }
  }

  public playerFemaleModel(): ItemModelInfo {
    return {
      name: 'Player',
      itemClass: [],
      itemId: null,
      label: 'Player',
      url: `${this.cdnHost || ''}/objects/characters/player/female/player_female.glb`.toString().toLowerCase(),
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
      }),
    )
  }

  public byHousingItemId(itemId$: Observable<string>) {
    return this.db.housingItem(itemId$).pipe(
      map((item): ItemModelInfo => {
        if (!item?.PrefabPath) {
          return null
        }
        return {
          name: item.Name,
          itemClass: item['HousingTag1 Placed'].filter((it) => !!it),
          itemId: item.HouseItemID,
          label: item.Name,
          url: `${this.cdnHost || ''}/${item.PrefabPath}.glb`.toString().toLowerCase(),
          appearance: null,
        }
      }),
    )
  }

  public byAppearanceId(appearanceId$: Observable<string>) {
    return combineLatest({
      item: this.db.itemAppearance(appearanceId$).pipe(map((it) => this.selectItemModels(it))),
      weapon: this.db.weaponAppearance(appearanceId$).pipe(map((it) => this.selectWeaponModels(it))),
      weaponMale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.Appearance)),
        map((it) => this.selectItemModels(it)),
      ),
      weaponFemale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.FemaleAppearance)),
        map((it) => this.selectItemModels(it)),
      ),
      mountAttachment: this.db.mountAttachmentsAppearance(appearanceId$).pipe(map((it) => this.selectWeaponModels(it))),
      instrument: this.db.instrumentAppearance(appearanceId$).pipe(map((it) => this.selectInstrumentModels(it))),
    }).pipe(
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
    return combineLatest({
      meta: this.db.vitalsMeta(vitalsId$),
      modelsMap: this.db.vitalsModelsMetadataMap,
      vital: this.db.vital(vitalsId$),
    }).pipe(
      map(({ meta, modelsMap, vital }) => {
        const models = meta?.models?.map((it) => modelsMap.get(it))?.filter((it) => !!it)
        if (!models?.length) {
          return null
        }
        return models.map((model, i): ItemModelInfo => {
          return {
            name: vital?.DisplayName,
            label: `Model ${i + 1}`,
            url: `${this.cdnHost || ''}/vitals/${model.id}.glb`.toLowerCase(),
            itemClass: [],
            itemId: meta.vitalsID,
            appearance: null,
          }
        })
      }),
    )
  }

  public byMountId(mountId$: Observable<string>) {
    return this.db.mount(mountId$).pipe(
      map((mount): ItemModelInfo[] => {
        if (!mount?.Mesh) {
          return null
        }
        return [
          {
            name: mount.DisplayName,
            label: `Model`,
            url: `${this.cdnHost || ''}/mounts/${mount.MountId}.glb`.toLowerCase(),
            itemClass: [],
            itemId: mount.MountId,
            appearance: mount,
          },
        ]
      }),
    )
  }

  public byCostumeId(costumeId$: Observable<string>) {
    return this.db.costume(costumeId$).pipe(
      map((value): ItemModelInfo[] => {
        if (!value?.CostumeChangeMesh) {
          return null
        }
        return [
          {
            name: humanize(value.CostumeChangeId),
            label: `Model`,
            url: `${this.cdnHost || ''}/costumechanges/${value.CostumeChangeId}.glb`.toLowerCase(),
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

  private selectItemModels(item: ArmorAppearanceDefinitions): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (item?.Skin1) {
      result.push({
        name: item.Name,
        itemId: item.ItemID,
        url: `${this.cdnHost || ''}/itemappearances/${item.ItemID}-Skin1.glb`.toLowerCase(),
        label: 'Model',
        itemClass: [...(item.ItemClass || [])],
        appearance: item,
      })
    }
    if (item?.ShortsleeveChestSkin) {
      result.push({
        name: item.Name,
        itemId: item.ItemID,
        url: `${this.cdnHost || ''}/itemappearances/${item.ItemID}-ShortsleeveChestSkin.glb`.toLowerCase(),
        label: 'Model Shot Sleeve',
        itemClass: [...(item.ItemClass || [])],
        appearance: item,
      })
    }
    return result
  }

  private selectWeaponModels(
    item: WeaponAppearanceDefinitions, // | ItemdefinitionsWeaponappearancesMountattachments,
  ): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item?.MeshOverride) {
      return result
    }
    result.push({
      name: item.Name,
      itemId: item.WeaponAppearanceID,
      url: `${this.cdnHost || ''}/${item.MeshOverride}.glb`.toLowerCase(),
      label: 'Model',
      itemClass: [...(item.ItemClass || [])],
      appearance: item,
    })
    return result
  }

  private selectInstrumentModels(item: WeaponAppearanceDefinitions): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item?.MeshOverride) {
      return result
    }
    result.push({
      name: item.Name,
      itemId: item.WeaponAppearanceID,
      url: `${this.cdnHost || ''}/${item.MeshOverride}.glb`.toLowerCase(),
      label: 'Model',
      itemClass: [...(item.ItemClass || [])],
      appearance: item,
    })
    return result
  }

  private selectMountAttachmentsModels(item: WeaponAppearanceDefinitions): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item) {
      return result
    }
    // result.push({
    //   name: item.Name,
    //   itemId: item.WeaponAppearanceID,
    //   url: `${this.cdnHost || ''}/weaponappearances/${item.WeaponAppearanceID}-${key}.glb`.toLowerCase(),
    //   label: 'Model',
    //   itemClass: [...(item.ItemClass || [])],
    //   appearance: item,
    // })
    return result
  }
}

function housingItemModelPath(item: HouseItems) {
  return `${item.PrefabPath}.dynamicslice.glb`.toLowerCase()
}
