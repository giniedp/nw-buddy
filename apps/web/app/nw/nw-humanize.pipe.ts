import { Pipe, PipeTransform } from '@angular/core'
import { humanize } from '~/utils'

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
