import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, Input, Output } from '@angular/core'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { AppearanceDetailStore } from './appearance-detail.store'
import { combineLatest } from 'rxjs'
import { RouterModule } from '@angular/router'
import { ItemDetailModule } from '../item-detail'
import { IconsModule } from '~/ui/icons'
import { TooltipModule } from '~/ui/tooltip'
import { svgBrush } from '~/ui/icons/svg'
import {
  Itemappearancedefinitions,
  ItemdefinitionsInstrumentsappearances,
  ItemdefinitionsWeaponappearances,
} from '@nw-data/generated'

@Component({
  standalone: true,
  selector: 'nwb-appearance-detail',
  templateUrl: './appearance-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, RouterModule, ItemDetailModule, IconsModule, TooltipModule],
  providers: [
    {
      provide: AppearanceDetailStore,
      useExisting: forwardRef(() => AppearanceDetailComponent),
    },
  ],
  host: {
    class: 'flex flex-col gap-1',
  },
})
export class AppearanceDetailComponent extends AppearanceDetailStore {
  @Input()
  public set appearanceId(value: string) {
    this.patchState({ appearanceId: value })
  }

  @Input()
  public set appearance(
    value: Itemappearancedefinitions | ItemdefinitionsInstrumentsappearances | ItemdefinitionsWeaponappearances
  ) {
    this.load(value)
  }

  @Input()
  public disableProperties: boolean

  @Output()
  public appearanceChange$ = this.appearance$

  protected iconDye = svgBrush
  protected vm$ = this.select(
    combineLatest({
      id: this.appearanceId$,
      appearance: this.appearance$,
      icon: this.icon$,
      name: this.name$,
      description: this.description$,
      category: this.category$,
    }),
    (data) => {
      if (!data.appearance || !data.category) {
        return null
      }
      return {
        ...data,
        link: ['/transmog', data.category.id, data.id],
      }
    }
  )
}
