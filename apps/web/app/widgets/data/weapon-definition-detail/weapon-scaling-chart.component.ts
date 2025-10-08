import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core'
import { AttributeRef, NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { ChartModule } from '../../../ui/chart'
import { IconsModule } from '../../../ui/icons'
import { svgChartLine } from '../../../ui/icons/svg'
import { TooltipModule } from '../../../ui/tooltip'
import { WeaponScalingChartStore } from './weapon-scaling-chart.store'

@Component({
  selector: 'nwb-weapon-scaling-chart',
  template: ` <nwb-chart [config]="config()" class="bg-base-100 rounded-md p-2" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartModule, IconsModule, TooltipModule],
  providers: [WeaponScalingChartStore],
  host: {
    class: 'block relative',
  },
})
export class WeaponScalingChartComponent {
  private store = inject(WeaponScalingChartStore)

  public affixId = input<string>(null)
  public itemId = input<string>(null)
  public weaponId = input<string>(null)
  public weaponTag = input<string>(null)
  public level = input<number>(NW_MAX_CHARACTER_LEVEL)
  public gearScore = input<number>(NW_MAX_GEAR_SCORE)
  public attrDex = input<number>(null)
  public attrStr = input<number>(null)
  public attrCon = input<number>(null)
  public attrInt = input<number>(null)
  public attrFoc = input<number>(null)

  protected readonly config = this.store.chartConfig
  protected readonly modeIcon = svgChartLine
  private stats = computed((): Record<AttributeRef, number> => {
    return {
      dex: this.attrDex(),
      str: this.attrStr(),
      con: this.attrCon(),
      int: this.attrInt(),
      foc: this.attrFoc(),
    }
  })

  public readonly damageScale = computed(() => this.store.damageStats().scale)
  public readonly damageValue = computed(() => this.store.damageStats().value)
  public readonly damageInvalid = computed(() => this.store.damageStats().invalidValue)

  public constructor() {
    effect(() => {
      const itemId = this.itemId()
      const weaponId = this.weaponId()
      const weaponTag = this.weaponTag()
      if (weaponId) {
        this.store.loadByWeaponId(weaponId)
      } else if (weaponTag) {
        this.store.loadByWeaponId(weaponTag)
      } else if (itemId) {
        this.store.loadByItemId(itemId)
      }
    })
    this.store.connectAffixId(this.affixId)
    this.store.connectGearScore(this.gearScore)
    this.store.connectLevel(this.level)
    this.store.connectStats(this.stats)
  }
}
