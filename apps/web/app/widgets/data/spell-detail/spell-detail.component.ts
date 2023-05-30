import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core'
import { Spelltable } from '@nw-data/generated'
import { NwDbService, NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule, PropertyGridCell } from '~/ui/property-grid'
import { SpellDetailStore } from './spell-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-spell-detail',
  templateUrl: './spell-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, PropertyGridModule],
  providers: [
    {
      provide: SpellDetailStore,
      useExisting: forwardRef(() => SpellDetailComponent),
    },
  ],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class SpellDetailComponent extends SpellDetailStore {
  @Input()
  public set spellId(value: string) {
    this.patchState({ spellId: value })
  }

  public constructor(db: NwDbService) {
    super(db)
  }

  public formatValue = (value: any, key: keyof Spelltable): PropertyGridCell | PropertyGridCell[] =>  {
    switch (key) {

      default: {
        if (Array.isArray(value)) {
          return value.map((it) => ({
            value: String(it),
            secondary: true,
          }))
        }
        return [{
          value: String(value),
          accent: typeof value === 'number',
          info: typeof value === 'boolean',
          bold: typeof value === 'boolean'
        }]
      }
    }
  }
}

function statusEffectCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    const isLink = it !== 'All'
    return {
      value: String(it),
      accent: isLink,
      routerLink: isLink ? ['/status-effects/table', it] : null
    }
  })
}

function abilitiesCells(list: string | string[]): PropertyGridCell[] {
  list = typeof list === 'string' ? [list] : list
  return list?.map((it) => {
    return {
      value: String(it),
      accent: true,
      routerLink: ['/abilities/table', it]
    }
  })
}

