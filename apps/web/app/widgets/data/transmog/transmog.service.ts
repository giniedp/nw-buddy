import { Injectable, inject } from '@angular/core'
import {
  ItemDefinitionMaster,
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'
import { Observable, combineLatest, map, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService } from '~/nw'
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
import { getAppearanceGearsetId } from '@nw-data/common'

@Injectable({ providedIn: 'root' })
export class TransmogService {
  private readonly db = inject(NwDbService)
  private readonly tl8 = inject(TranslateService)

  public readonly categories$ = of(TRANSMOG_CATEGORIES)
  public readonly transmogItems$ = selectStream(
    {
      categories: of(TRANSMOG_CATEGORIES),
      itemsMap: this.db.itemsByAppearanceId,
      itemAppearances: this.db.itemAppearances,
      weaponAppearances: this.db.weaponAppearances,
      instrumentAppearances: this.db.instrumentAppearances,
    },
    (data) => selectAppearances(data)
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
      })
    )
  }
}

function selectAppearances({
  itemsMap,
  itemAppearances,
  weaponAppearances,
  instrumentAppearances,
  categories,
}: {
  itemsMap: Map<string, Set<ItemDefinitionMaster>>
  itemAppearances: Itemappearancedefinitions[]
  weaponAppearances: ItemdefinitionsWeaponappearances[]
  instrumentAppearances: ItemdefinitionsInstrumentsappearances[]
  categories: TransmogCategory[]
}): TransmogItem[] {
  const appearances = [...itemAppearances, ...weaponAppearances, ...instrumentAppearances]
  const transmogMap = new CaseInsensitiveMap<string, TransmogItem>()
  for (const appearance of appearances) {
    const appearanceId = getAppearanceId(appearance)
    const { category, subcategory } = categorizeAppearance(appearance, categories)
    const sources = Array.from(itemsMap.get(appearanceId)?.values() || [])
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
    }
    const appearanceName = (appearance as Itemappearancedefinitions).AppearanceName
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
