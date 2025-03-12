import { Injectable, inject } from '@angular/core'
import { getAppearanceGearsetId, getItemSetFamilyName } from '@nw-data/common'
import { ArmorAppearanceDefinitions, MasterItemDefinitions, WeaponAppearanceDefinitions } from '@nw-data/generated'
import { uniq } from 'lodash'
import { Observable, combineLatest, map, of } from 'rxjs'
import { injectNwData } from '~/data'
import { TranslateService } from '~/i18n'
import { CaseInsensitiveMap, selectStream } from '~/utils'
import { TRANSMOG_CATEGORIES, TransmogCategory, categorizeAppearance } from './transmog-categories'
import {
  TransmogAppearance,
  TransmogItem,
  getAppearanceGender,
  getAppearanceId,
  getAppearanceIdName,
  haveAppearancesSameModelFile,
} from './transmog-item'

@Injectable({ providedIn: 'root' })
export class TransmogService {
  private readonly db = injectNwData()
  private readonly tl8 = inject(TranslateService)

  public readonly categories$ = of(TRANSMOG_CATEGORIES)
  public readonly transmogItems$ = selectStream(
    {
      categories: of(TRANSMOG_CATEGORIES),
      itemsMap: this.db.itemsByAppearanceIdMap(),
      itemAppearances: this.db.armorAppearancesAll(),
      weaponAppearances: this.db.weaponAppearancesAll(),
      instrumentAppearances: this.db.instrumentAppearancesAll(),
      mountAttachnetAppearances: this.db.mountAttachmentsAppearancesAll(),
    },
    (data) => selectAppearances(data),
  )
  public readonly transmogItemsMap$ = selectStream(this.transmogItems$, (appearances) => {
    return new CaseInsensitiveMap<string, TransmogItem>(appearances.map((it) => [it.id, it]))
  })

  public byAppearance(appearance$: Observable<TransmogAppearance>): Observable<TransmogItem> {
    return combineLatest({
      transmogMap: this.transmogItemsMap$,
      appearance: appearance$,
    }).pipe(map(({ transmogMap, appearance }) => transmogMap.get(getAppearanceIdName(appearance))))
  }

  public withSameModelAs(appearance$: Observable<TransmogAppearance>, excludeSelf = false): Observable<TransmogItem[]> {
    return combineLatest({
      transmogs: this.transmogItems$,
      appearance: appearance$,
    }).pipe(
      map(({ transmogs, appearance }) => {
        return transmogs.filter((it) => {
          if (!haveAppearancesSameModelFile(it.appearance, appearance)) {
            return false
          }
          if (excludeSelf && getAppearanceIdName(it.appearance) === getAppearanceIdName(appearance)) {
            return false
          }
          return true
        })
      }),
    )
  }
}

function selectAppearances({
  itemsMap,
  itemAppearances,
  weaponAppearances,
  instrumentAppearances,
  mountAttachnetAppearances,
  categories,
}: {
  itemsMap: Map<string, MasterItemDefinitions[]>
  itemAppearances: ArmorAppearanceDefinitions[]
  weaponAppearances: WeaponAppearanceDefinitions[]
  instrumentAppearances: WeaponAppearanceDefinitions[]
  mountAttachnetAppearances: WeaponAppearanceDefinitions[]
  categories: TransmogCategory[]
}): TransmogItem[] {
  const appearances = [...itemAppearances, ...weaponAppearances, ...instrumentAppearances, ...mountAttachnetAppearances]
  const transmogMap = new CaseInsensitiveMap<string, TransmogItem>()
  for (const appearance of appearances) {
    const appearanceId = getAppearanceId(appearance)
    const { category, subcategory } = categorizeAppearance(appearance, categories)
    const sources = itemsMap.get(appearanceId) || []
    const gender = getAppearanceGender(appearance)

    const transmog: TransmogItem = {
      id: appearanceId,
      gearsetId: getAppearanceGearsetId(appearanceId),
      appearance: appearance,
      male: null,
      female: null,
      set: null,
      category: category,
      subcategory: subcategory,
      items: sources,
      itemSets: uniq(sources.map(getItemSetFamilyName)),
    }
    const appearanceName = (appearance as ArmorAppearanceDefinitions).AppearanceName
    if (!appearanceName || !gender) {
      transmogMap.set(transmog.id, transmog)
      continue
    }

    let parent: TransmogItem = transmogMap.get(appearanceName)
    if (!parent) {
      parent = {
        ...transmog,
        id: appearanceName,
      }
      transmogMap.set(parent.id, parent)
    }
    if (gender === 'male') {
      parent.male = transmog
    }
    if (gender === 'female') {
      parent.female = transmog
    }
  }
  const result = Array.from(transmogMap.values())
  for (const transmog of result) {
    transmog.set = result.filter((it) => it.gearsetId === transmog.gearsetId)
  }
  return result
}
