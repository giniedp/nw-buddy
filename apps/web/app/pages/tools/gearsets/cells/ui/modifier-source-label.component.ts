import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { getItemIconPath } from '@nw-data/common'
import { NwModule } from '~/nw'
import { ModifierSource } from '~/nw/mannequin/modifier'
import { humanize } from '~/utils'

@Component({
  selector: 'nwb-modifier-source-label',
  template: `
    <img [nwImage]="icon" class="w-6 h-6" *ngIf="icon" />
    <div [innerHTML]="label | nwText | nwTextBreak" class="text-ellipsis overflow-hidden max-w-[200px]"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'inline-flex flex-row gap-x-1 items-center whitespace-nowrap',
  },
})
export class ModifierSourceLabelComponent {
  @Input()
  public set data(value: ModifierSource) {
    this.label = this.resolve(value).label
    this.icon = this.resolve(value).icon
  }

  protected label: string
  protected icon: string

  private resolve(data: ModifierSource) {
    if (data.perk) {
      return {
        icon: data.perk.IconPath || data.icon,
        label: data.perk.DisplayName || data.perk.SecondaryEffectDisplayName || data.label,
      }
    }
    if (data.item) {
      return {
        icon: getItemIconPath(data.item),
        label: data.item.Name,
      }
    }
    if (data.ability) {
      let label = data.ability.DisplayName || data.label || data.ability.AbilityID
      if (data.ability.AbilityID.match(/_Bonus_\d+_\d$/)) {
        label = humanize(data.ability.AbilityID.replace(/_\d$/, ''))
      }
      return {
        icon: data.ability.Icon || data.icon,
        label: label,
      }
    }
    if (data.effect) {
      return {
        icon: data.effect.PlaceholderIcon || data.icon,
        label: data.effect.DisplayName || data.label,
      }
    }
    return {
      icon: data.icon,
      label: data.label,
    }
  }
}
