import { Pipe, PipeTransform } from '@angular/core'
import { sortBy } from 'lodash'

@Pipe({
  standalone: true,
  name: 'nwbEntries',
})
export class EntriesPipe implements PipeTransform {
  public transform(value: any, sort?: 'asc' | 'desc'): Array<{ key: string; value: any }> {
    value = (Array.isArray(value) ? value : [value])
      .filter((it) => !!it)
      .map((it) => Object.entries(it))
      .flat(1)
      .map(([key, value]) => ({ key, value }))

    if (sort) {
      value = sortBy(value, (it) => it.key)
    }
    if (sort === 'desc') {
      value.reverse()
    }
    return value
  }
}
