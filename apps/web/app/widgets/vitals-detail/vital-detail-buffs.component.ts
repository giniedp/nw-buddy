import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { VitalDetailStore } from './vital-detail.store'
import { TooltipModule } from '~/ui/tooltip'
import { StatusEffectDetailModule } from '../data/status-effect-detail'
import { AbilityDetailModule } from '../data/ability-detail'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-buffs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, TooltipModule, StatusEffectDetailModule, AbilityDetailModule],
  styles: [],
  host: {
    class: 'flex flex-col gap-2 p-3',
  },
  template: `
    <a
      *ngFor="let item of effects$ | async"
      class="flex flex-row gap-2 link-hover text-sky-600"
      [routerLink]="['/status-effects/table', item.id]"
      [tooltip]="tplEffectTip"
      [tooltipClass]="'p-0 w-full max-w-sm'"
    >
      <picture class="flex-none">
        <img [nwImage]="item.icon" class="w-6 h-6" />
      </picture>
      <div>
        <b>{{ item.label | nwText }}: </b>
        {{ item.text | nwText }}
      </div>
      <ng-template #tplEffectTip>
        <nwb-status-effect-detail [effectId]="item.id"></nwb-status-effect-detail>
      </ng-template>
    </a>

    <a
      *ngFor="let item of abilities$ | async"
      class="flex flex-row gap-2 link-hover text-sky-600"
      [routerLink]="['/abilities/table', item.id]"
      [tooltip]="tplAbilityTip"
      [tooltipClass]="'p-0 w-full max-w-sm'"
    >
      <picture class="flex-none">
        <img [nwImage]="item.icon" class="w-6 h-6" />
      </picture>
      <div>
        <code>{{ item.label | nwText }} </code>
      </div>
      <ng-template #tplAbilityTip>
        <nwb-ability-detail [abilityId]="item.id"></nwb-ability-detail>
      </ng-template>
    </a>
  `,
})
export class VitalDetailBuffsComponent {
  private store = inject(VitalDetailStore)
  protected effects$ = this.store.mutaBuffs$.pipe(
    map((list) => {
      return list?.effects?.map((it) => {
        return {
          id: it.StatusID,
          icon: it.PlaceholderIcon || NW_FALLBACK_ICON,
          label: it.DisplayName || it.StatusID,
          text: it.Description || (it.DisplayName ? `${it.StatusID}_Tooltip` : ''),
        }
      })
    })
  )

  protected abilities$ = this.store.mutaBuffs$.pipe(
    map((list) => {
      return list?.abilities?.map((it) => {
        return {
          id: it.AbilityID,
          icon: it.Icon || NW_FALLBACK_ICON,
          label: it.DisplayName || it.AbilityID,
        }
      })
    })
  )
}
