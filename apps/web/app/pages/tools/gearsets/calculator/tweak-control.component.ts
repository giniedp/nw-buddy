import { CommonModule } from '@angular/common'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-tweak-control',
  templateUrl: './tweak-control.component.html',
  host: {
    class: 'form-control',
  },
  imports: [CommonModule, NwModule, FormsModule, IconsModule]
})
export class TweakControlComponent {

  @Input()
  public label: string

  @Input()
  public iconPath: string

  @Input()
  public rightValue: number = 0

  @Input()
  public leftValue: number = 0

  @Input()
  public tweakValue: number = 0

  @Output()
  public tweakValueChange = new EventEmitter<number>()

  @Input()
  public percent = false

  @Input()
  public step: number = 1

  @Input()
  public format: string = '0.2-2'

  protected toModelValue(value: number) {
    return this.percent ? Math.round(value * 100) : value
  }

  protected fromModelValue(value: number) {
    return this.percent ? value / 100 : value
  }

  protected onValueChange(value: number) {
  }
}
