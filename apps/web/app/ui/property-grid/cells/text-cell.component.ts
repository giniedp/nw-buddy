import { Component, HostBinding, input } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { ComponentInputs, PropertyGridCell } from '../property-grid-cell.directive'

export function textCell(options: ComponentInputs<TextCellComponent>): PropertyGridCell {
  return {
    value: String(options.value),
    component: TextCellComponent,
    componentInputs: options,
  }
}

@Component({
  selector: 'nwb-text-cell',
  template: `{{ value() }}`,
  host: {
    class: 'inline',
    '[class.font-bold]': 'fontBold()',
    '[class.italic]': 'fontItalic()',
    '[class.text-primary]': 'textPrimary()',
    '[class.text-secondary]': 'textSecondary()',
    '[class.text-accent]': 'textAccent()',
    '[class.text-info]': 'textInfo()',
    '[class.text-success]': 'textSuccess()',
    '[class.text-warning]': 'textWarning()',
    '[class.text-danger]': 'textDanger()',
  },
  imports: [NwModule, RouterModule],
})
export class TextCellComponent {
  public value = input<string>()
  public textPrimary = input<boolean>()
  public textSecondary = input<boolean>()
  public textAccent = input<boolean>()
  public textInfo = input<boolean>()
  public textSuccess = input<boolean>()
  public textWarning = input<boolean>()
  public textDanger = input<boolean>()
  public fontBold = input<boolean>()
  public fontItalic = input<boolean>()
}
