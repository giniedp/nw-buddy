import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { NwModule } from '~/nw'
import { getVitalCategoryInfo, getVitalFamilyInfo, getVitalTypeMarker, VitalFamilyInfo } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, IconsModule, TooltipModule],
  host: {
    class: 'relative bg-base-300 flex flex-col items-center justify-center p-2',
  },
  template: `
    <a *ngIf="familyIcon; let icon" [tooltip]="familyTip" class="absolute left-1">
      <img [nwImage]="icon" class="w-12 h-12" />
    </a>

    <div class="flex flex-row items-center gap-1">
      <span>{{ vital.DisplayName | nwText }}</span>
    </div>
    <a
      class="relative flex items-center justify-center -mt-4"
      [nwLink]="vital.VitalsID"
      [nwLinkResource]="'vitals'"
      target="_blank"
    >
      <img [nwImage]="typeMarker" class="h-10 w-36 object-cover" />
      <span *ngIf="vital.Level" class="absolute top-2 mx-auto"> {{ vital.Level }}</span>
    </a>
  `,
})
export class VitalDetailHeaderComponent {
  @Input()
  public set vital(value: Vitals) {
    this.vitalValue = value
    this.familyInfo = getVitalFamilyInfo(value)
    this.combatInfo = getVitalCategoryInfo(value)
    this.typeMarker = getVitalTypeMarker(value)
  }
  public get vital() {
    return this.vitalValue
  }

  protected get familyIcon() {
    return this.combatInfo.IconBane
  }
  protected get familyTip() {
    if (this.familyInfo?.ID === this.combatInfo?.ID) {
      return null
    }
    if (!this.combatInfo?.ID) {
      return `Not affected by ward, bane or trophy`
    }
    return `Is affected by ${humanize(this.combatInfo.Name)} ward, bane and trophy`
  }

  protected linkIcon = svgSquareArrowUpRight
  protected familyInfo: VitalFamilyInfo
  protected combatInfo: VitalFamilyInfo
  protected typeMarker: string
  private vitalValue: Vitals
}
