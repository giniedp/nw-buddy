import { Pipe, PipeTransform } from '@angular/core'
import { humanize } from '~/utils'
import { NwExpressionContext } from './expression'

export type NwTextPipeOptions = Partial<NwExpressionContext>

@Pipe({
  standalone: true,
  name: 'nwHumanize',
  pure: true,
})
export class NwHumanizePipe implements PipeTransform {
  public transform(value: string) {
    return humanize(value || '')
  }
}
