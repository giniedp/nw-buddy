import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'

@Component({
  standalone: true,
  selector: 'nwb-label-control',
  templateUrl: './label-control.component.html',
  host: {
    class: 'form-control',
  },
  imports: [CommonModule, NwModule, FormsModule, IconsModule],
})
export class LabelControlComponent {
  @Input()
  public label: string

  @Input()
  public value: number = 0

  @Input()
  public isTweaked: boolean

  @Input()
  public percent = false

  @Input()
  public format: string = '0.2-2'
}
