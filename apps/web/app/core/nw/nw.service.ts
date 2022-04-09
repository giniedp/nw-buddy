import { Injectable } from '@angular/core'
import { ItemDefinitionMaster } from '@nw-data/types'

import { GridOptions } from 'ag-grid-community'
import { TranslateService } from '../i18n'
import { NwDbService } from './nw-db.service'
import { NwItemMetaService } from './nw-item-meta.service'
import { nwdbLinkUrl } from './nwdbinfo'

@Injectable({ providedIn: 'root' })
export class NwService {
  public constructor(
    public readonly meta: NwItemMetaService,
    public readonly db: NwDbService,
    public readonly translations: TranslateService
  ) {}

  public gridOptions<T>(options: GridOptions): GridOptions {
    return {
      rowHeight: 40,
      defaultColDef: {
        sortable: true,
        filter: true,
        floatingFilter: true,
        ...(options.defaultColDef || {}),
      },
      ...options,
    }
  }

  public cellRendererIcon = <T>(key: keyof T, options?: { size?: number; rarity?: (item: T) => number }) => {
    return (params: { data: T }) => {
      return this.renderIcon(params.data[key] as any, {
        size: options.size,
        rarity: options?.rarity?.(params.data),
      })
    }
  }

  public nwdbLinkUrl = nwdbLinkUrl

  public renderIcon(path: string, options?: { size?: number; rarity?: number }) {
    const iconPath = this.iconPath(path as string)
    const rarity = options?.rarity
    return createIconHtml(iconPath, {
      size: options?.size,
      class: rarity ? `bg-rarity-${rarity}` : null,
    })
  }

  public itemRarity(item: ItemDefinitionMaster) {
    if (item.ForceRarity) {
      return item.ForceRarity
    }

    if (item.Perk5) {
      return 4
    }
    if (item.Perk4) {
      return 3
    }
    if (item.Perk3) {
      return 2
    }
    if (item.Perk2) {
      return 1
    }
    if (item.Perk1) {
      return 0
    }
    return 0
  }

  public itemRarityKey(item: ItemDefinitionMaster) {
    return `RarityLevel${this.itemRarity(item)}_DisplayName`
  }

  public itemRarityName(item: ItemDefinitionMaster) {
    return this.translate(this.itemRarityKey(item))
  }

  public iconPath(path: string) {
    return this.db.data.iconPath(path)
  }
  public translate(key: string) {
    return this.translations.get(buildTranslateKey(key))
  }
}

function buildTranslateKey(key: string, options?: { prefix?: string; suffix?: string }) {
  if (key == null) {
    return key
  }
  key = String(key)
  if (options) {
    if (options.prefix) {
      key = options.prefix + key
    }
    if (options.suffix) {
      key = key + options.suffix
    }
  }
  if (key.startsWith('@')) {
    return key.substring(1)
  }
  return key
}

function createIconHtml(path: string, options: { size: number; class: string }) {
  const size = options?.size ?? 36
  const cclass = ['nw-icon', 'fade', options?.class].filter((it) => !!it).join(' ')
  return `
    <picture class="${cclass}" style="width: ${size}px; height: ${size}px">
      <img src="${path}" onerror="this.parentElement.classList.add('error')" onload="this.parentElement.classList.add('show')"/>
    </picture>
  `
}
