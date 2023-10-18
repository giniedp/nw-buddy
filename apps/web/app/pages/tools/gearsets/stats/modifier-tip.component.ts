import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { NwModule } from '~/nw'
import { ModifierResult, ModifierValue } from '~/nw/mannequin/modifier'
import { ModifierSourceLabelComponent } from './modifier-source-label.component'

@Component({
  standalone: true,
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
  public data: ModifierResult

  @Input()
  public title: string

  @Input()
  public format = '0.0-0'

  @Input()
  public operator = '+'

  @Input()
  public percent = true

  protected trackBy = (i: number) => i

  public constructor() {
    //
  }
}
