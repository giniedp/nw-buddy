import { Injectable } from '@angular/core'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
  ItemdefinitionsWeaponappearancesMountattachments,
} from '@nw-data/generated'
import { environment } from '~/../environments'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { humanize } from '~/utils'
export interface ItemModelInfo {
  name: string
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

@Injectable({ providedIn: 'root' })
export class ModelViewerService {
  private cdnHost = environment.nwModelsUrl

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
    return this.db.housingItem(itemId$).pipe(
      map((item): ItemModelInfo => {
        if (!item?.PrefabPath) {
          return null
        }
        console.log(this.cdnHost)
        return {
          name: item.Name,
          itemClass: [item['HousingTag1 Placed']].filter((it) => !!it),
          itemId: item.HouseItemID,
          label: item.Name,
          url: `${this.cdnHost || ''}/housingitems/${item.PrefabPath}.dynamicslice.glb`.toString().toLowerCase(),
        }
      })
    )
  }

  public byAppearanceId(appearanceId$: Observable<string>) {
    return combineLatest({
      item: this.db.itemAppearance(appearanceId$).pipe(map((it) => this.selectItemModels(it))),
      weapon: this.db.weaponAppearance(appearanceId$).pipe(map((it) => this.selectWeaponModels(it))),
      weaponMale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.Appearance)),
        map((it) => this.selectItemModels(it))
      ),
      weaponFemale: this.db.weaponAppearance(appearanceId$).pipe(
        switchMap((it) => this.db.itemAppearance(it?.FemaleAppearance)),
        map((it) => this.selectItemModels(it))
      ),
      mountAttachment: this.db.mountAttachmentsAppearance(appearanceId$).pipe(map((it) => this.selectWeaponModels(it))),
      instrument: this.db.instrumentAppearance(appearanceId$).pipe(map((it) => this.selectInstrumentModels(it))),
    }).pipe(
      map(({ item, weapon, weaponMale, weaponFemale, mountAttachment, instrument }) => {
        return [...item, ...weaponMale, ...weaponFemale, ...weapon, ...mountAttachment, ...instrument]
      })
    )
  }

  public byVitalsId(vitalsId$: Observable<string>) {
    return combineLatest({
      meta: this.db.vitalsMeta(vitalsId$),
      vital: this.db.vital(vitalsId$),
    }).pipe(
      map(({ meta, vital }) => {
        const files = meta?.models?.filter((it) => it.startsWith('slices/characters/'))
        if (!files?.length) {
          return null
        }
        return files.map((file, i): ItemModelInfo => {
          return {
            name: vital?.DisplayName,
            label: `Model ${i + 1}`,
            url: `${this.cdnHost || ''}/${file}`.toLowerCase(),
            itemClass: [],
            itemId: meta.vitalsID,
          }
        })
      })
    )
  }

  public byMountId(mountId$: Observable<string>) {
    return this.db.mount(mountId$).pipe(
      map((mount) => {
        if (!mount?.Mesh) {
          return null
        }
        return [
          {
            name: mount.DisplayName,
            label: `Model`,
            url: `${this.cdnHost || ''}/mounts/${mount.MountId}-Mesh.glb`.toLowerCase(),
            itemClass: [],
            itemId: mount.MountId,
          },
        ]
      })
    )
  }

  public byCostumeId(costumeId$: Observable<string>) {
    return this.db.costume(costumeId$).pipe(
      map((value) => {
        if (!value?.CostumeChangeMesh) {
          return null
        }
        return [
          {
            name: humanize(value.CostumeChangeId),
            label: `Model`,
            url: `${this.cdnHost || ''}/costumechanges/${value.CostumeChangeId}-Mesh.glb`.toLowerCase(),
            itemClass: [],
            itemId: value.CostumeChangeId,
          },
        ]
      })
    )
  }

  private selectItemModels(item: Itemappearancedefinitions): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item) {
      return result
    }

    const keys: Array<keyof Itemappearancedefinitions> = ['Skin1', 'Skin2', 'AppearanceCDF']
    const labels = {
      Skin1: 'Model 1',
      Skin2: 'Model 2',
      AppearanceCDF: 'Full Set',
    }
    for (const key of keys) {
      if (!item[key]) {
        continue
      }
      result.push({
        name: item.Name,
        itemId: item.ItemID,
        url: `${this.cdnHost || ''}/itemappearances/${item.ItemID}-${key}.glb`.toLowerCase(),
        label: labels[key] || key,
        itemClass: [...(item.ItemClass || [])],
      })
    }
    return result
  }

  private selectWeaponModels(
    item: ItemdefinitionsWeaponappearances | ItemdefinitionsWeaponappearancesMountattachments
  ): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item) {
      return result
    }
    const keys: Array<keyof ItemdefinitionsWeaponappearances> = ['SkinOverride1', 'SkinOverride2', 'MeshOverride']
    const labels = {
      SkinOverride1: 'Model 1',
      SkinOverride2: 'Model 2',
      MeshOverride: 'Model 3',
    }
    for (const key of keys) {
      if (item[key]) {
        result.push({
          name: item.Name,
          itemId: item.WeaponAppearanceID,
          url: `${this.cdnHost || ''}/weaponappearances/${item.WeaponAppearanceID}-${key}.glb`.toLowerCase(),
          label: labels[key] || key,
          itemClass: [...(item.ItemClass || [])],
        })
      }
    }
    return result
  }

  private selectInstrumentModels(item: ItemdefinitionsInstrumentsappearances): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item) {
      return result
    }
    const keys: Array<keyof ItemdefinitionsInstrumentsappearances> = ['MeshOverride']
    for (const key of keys) {
      if (item[key]) {
        result.push({
          name: item.Name,
          itemId: item.WeaponAppearanceID,
          url: `${this.cdnHost || ''}/instrumentappearances/${item.WeaponAppearanceID}-${key}.glb`.toLowerCase(),
          label: key,
          itemClass: [...(item.ItemClass || [])],
        })
      }
    }
    return result
  }

  private selectMountAttachmentsModels(item: ItemdefinitionsWeaponappearancesMountattachments): ItemModelInfo[] {
    const result: ItemModelInfo[] = []
    if (!item) {
      return result
    }
    const keys: Array<keyof ItemdefinitionsWeaponappearances> = ['SkinOverride1', 'SkinOverride2', 'MeshOverride']
    const labels = {
      SkinOverride1: 'Model 1',
      SkinOverride2: 'Model 2',
      MeshOverride: 'Model 3',
    }
    for (const key of keys) {
      if (item[key]) {
        result.push({
          name: item.Name,
          itemId: item.WeaponAppearanceID,
          url: `${this.cdnHost || ''}/weaponappearances/${item.WeaponAppearanceID}-${key}.glb`.toLowerCase(),
          label: labels[key] || key,
          itemClass: [...(item.ItemClass || [])],
        })
      }
    }
    return result
  }
}
