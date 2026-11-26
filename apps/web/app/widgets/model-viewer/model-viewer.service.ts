import { Injectable } from '@angular/core'
import { ArmorAppearanceDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { uniqBy } from 'lodash'
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { humanize } from '~/utils'
import {
  characterDefinitionModelUri,
  costumeModelUri,
  femaleModelUri,
  housingItemModelUri,
  itemAppearanceModelUri,
  maleModelUri,
  mountModelUri,
  vitalModelUri,
  weaponAppearanceModelUri,
} from './utils/get-model-uri'
import { armorSource, type ModelSource } from './utils/model-source'
import {
  mergeVitalModels,
  relatedVitalId,
  vitalModelLabel,
  vitalModelSockets,
  vitalModelTags,
  type ModelSocketInfo,
} from './utils/vital-models'

export type { ModelSource } from './utils/model-source'
export type { ModelSocketInfo } from './utils/vital-models'

export interface ModelItemInfo {
  name: string
  itemId: string
  label: string
  itemClass: string[]
  url: string
  appearance: any
  /**
   * A character model (`.cdf`: player, mount, costume, vital)
   */
  character?: boolean
  /**
   * The animation database and the tags of a character with fragments (vitals): the viewer lists and plays them
   */
  mannequin?: ModelMannequinInfo | null
  /**
   * The game files the model is converted from, as the `nwbt models` collectors read them. Null when unknown.
   */
  source?: ModelSource | null
  /**
   * The weapons a character holds
   */
  sockets?: ModelSocketInfo[]
  /**
   * The damage table file of a vital's model
   */
  damageTable?: string | null
  /**
   * The vital a model belongs to when it is shown for another one that has none of its own
   */
  relatedVitalId?: string | null
}

export interface ModelMannequinInfo {
  /**
   * Game path of the `.adb`, below the models root
   */
  database: string
  /**
   * The default tags and the ones of the held weapons
   */
  tags: string[]
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
      character: true,
      source: { model: 'objects/characters/player/male/player_male.cdf' },
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
      character: true,
      source: { model: 'objects/characters/player/female/player_female.cdf' },
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
          itemClass: [...(item.HousingTags ?? [])],
          itemId: item.HouseItemID,
          label: item.Name,
          url: uri,
          appearance: null,
          source: { model: `slices/${item.PrefabPath}.dynamicslice` },
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

  /**
   * The models the game spawns a vital with, else (none is known) the ones of the vitals with the same base row, see
   * {@link ModelItemInfo.relatedVitalId}
   */
  public byVitalsId(vitalsId$: Observable<string>) {
    return vitalsId$
      .pipe(
        switchMap((id) => {
          return combineLatest({
            vital: this.db.vitalsById(id),
            meta: this.db.vitalsMetadataById(id),
            modelsMap: this.db.vitalsModelsMetadataByIdMap(),
            equipTypes: this.db.equipTypesMetadataByIdMap(),
            vitalsMap: this.db.vitalsByIdMap(),
          })
        }),
      )
      .pipe(
        map(({ meta, modelsMap, equipTypes, vitalsMap, vital }) => {
          const isRelated = !meta?.models?.length
          const ids = isRelated ? meta?.relatedModels : meta?.models
          const models = mergeVitalModels((ids ?? []).map((it) => modelsMap.get(it)).filter((it) => !!it))
          if (!models.length) {
            return null
          }
          return models.map((model): ModelItemInfo => {
            return {
              name: vital?.DisplayName,
              label: vitalModelLabel(model),
              url: vitalModelUri(model),
              itemClass: [],
              itemId: meta.vitalsID,
              appearance: null,
              character: true,
              mannequin: model.adb ? { database: model.adb, tags: vitalModelTags(model) } : null,
              source: model.cdf
                ? { model: model.cdf, material: model.mtl || null, overcoat: model.overcoat || null }
                : null,
              sockets: vitalModelSockets(model.weapons, equipTypes),
              damageTable: model.table || null,
              relatedVitalId: isRelated ? relatedVitalId(model, vital?.BaseVitalsId, vitalsMap) : null,
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
            character: true,
            source: mount.Mesh ? { model: mount.Mesh, material: mount.Material || null } : null,
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
            character: true,
            source: value.CostumeChangeMesh ? { model: value.CostumeChangeMesh } : null,
          },
        ]
      }),
    )
  }

  public byNpcId(npcId$: Observable<string>) {
    return npcId$.pipe(
      switchMap((id) => this.db.npcsModelVariationsByNpcId(id)),
      map((variations): ModelItemInfo[] => {
        const models = (variations ?? [])
          .filter((it) => !!it.CharacterDefinition)
          .map((it): ModelItemInfo => {
            return {
              name: it.Name || humanize(it.NPCId),
              label: characterDefinitionLabel(it.CharacterDefinition),
              url: characterDefinitionModelUri(it.CharacterDefinition),
              itemClass: [],
              itemId: it.NPCId,
              appearance: null,
              character: true,
              source: { model: it.CharacterDefinition },
            }
          })
        // variations of an NPC share models
        return uniqBy(models, (it) => it.url)
      }),
    )
  }

  private selectItemModels(item: ArmorAppearanceDefinitions): ModelItemInfo[] {
    const result: ModelItemInfo[] = []
    if (item?.Skin1) {
      result.push({
        name: item.Name,
        itemId: item.ItemID,
        url: itemAppearanceModelUri(item, 'Skin1'),
        label: item.Gender || 'Skin',
        // some rows have no group, all groups open alike
        itemClass: [...(item.ItemClass || []), item.IconCaptureGroup || 'Chest'],
        appearance: item,
        source: armorSource(item),
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
      itemClass: weaponTags(item),
      appearance: item,
      source: item.MeshOverride ? { model: item.MeshOverride } : null,
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
      itemClass: weaponTags(item),
      appearance: item,
      source: item.MeshOverride ? { model: item.MeshOverride } : null,
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
      source: item.MeshOverride ? { model: item.MeshOverride } : null,
    })
    return result
  }
}

/**
 * The item class and the icon capture group of a weapon, tool, instrument or mount attachment
 */
function weaponTags(item: WeaponAppearanceDefinitions): string[] {
  const tags: string[] = [...(item.ItemClass || []), item.IconCaptureGroup]
  // mount attachments share one group, the shields among them lie like the shields of players
  if (/shield/i.test(item.MountAttachmentAppearanceId || '')) {
    tags.push('RoundShield')
  }
  return tags.filter((it) => !!it)
}

/**
 * The file name of a character definition, to tell the models of an NPC apart
 */
function characterDefinitionLabel(file: string) {
  const name = file.split(/[\\/]/).at(-1)
  return humanize(name.replace(/\.cdf$/i, ''))
}
