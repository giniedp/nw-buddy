import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { sumBy } from 'lodash'
import { NwModule } from '~/nw'
import { ModifierResult, ModifierValue } from '~/nw/mannequin/modifier'
import { ModifierSourceLabelComponent } from './modifier-source-label.component'

@Component({
  standalone: true,
  selector: 'nwb-modifier-cap-tip',
  templateUrl: './modifier-cap-tip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModifierSourceLabelComponent],
  host: {
    class: 'block bg-base-200 rounded-md',
  },
})
export class ModifierCapTipComponent {
  @Input()
  public set data(data: ModifierResult) {
    this.source = data.source || []
    this.value = data.value
    this.sumValue = sumBy(this.source, (it) => it.scale * it.value)
    this.showSum = this.source.length > 0 || this.value != this.sumValue
    this.hasCapped = this.source.some((it) => it['capped'])
    this.hasUncapped = this.source.some((it) => !it['capped'])
    this.isOvershoot = this.value !== this.sumValue
  }

  @Input()
  public title: string

  protected trackBy = (i: number) => i
  protected value: number
  protected sumValue: number
  protected source: ModifierValue<any>[]
  protected showSum: boolean
  protected hasUncapped: boolean
  protected hasCapped: boolean
  protected isOvershoot: boolean
}
