import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ModifierResult, ModifierValue } from '~/nw/mannequin/modifier'
import { ModifierSourceLabelComponent } from './modifier-source-label.component'
import { sumBy } from 'lodash'

@Component({
  selector: 'nwb-modifier-tip',
  templateUrl: './modifier-tip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModifierSourceLabelComponent],
  host: {
    class: 'block bg-base-200 rounded-md',
  },
})
export class ModifierTipComponent {
  @Input()
  public set data(data: ModifierResult) {
    this.source = data.source || []
    this.value = data.value
    this.sumValue = sumBy(this.source, (it) => it.scale * it.value)
    this.showSum = this.source.length > 1 || this.value != this.sumValue
    this.hasCapped = this.source.some((it) => it['capped'])
    this.hasUncapped = this.source.some((it) => !it['capped'])
    this.isOvershoot = this.value !== this.sumValue
  }

  @Input()
  public title: string

  @Input()
  public format = '0.1-1'

  @Input()
  public percent = true

  protected trackBy = (i: number) => i
  protected value: number
  protected sumValue: number
  protected source: ModifierValue<any>[]
  protected showSum: boolean
  protected hasUncapped: boolean
  protected hasCapped: boolean
  protected isOvershoot: boolean

  public constructor() {
    //
  }

  protected rowSign(it: ModifierValue<number>) {
    return it.value * it.scale < 0 ? '-' : '+'
  }

  protected rowValue(it: ModifierValue<number>) {
    return Math.abs(it.value * it.scale)
  }
}
