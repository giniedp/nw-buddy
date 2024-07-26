import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { environment } from 'apps/web/environments'
import { Subject, distinctUntilChanged } from 'rxjs'
import { LocaleService } from '~/i18n/locale.service'
import { selectStream } from '~/utils'
import { NwLinkResource, buddyLinkUrl } from './nw-link'

@Pipe({
  standalone: true,
  name: 'nwLink',
  pure: false,
})
export class NwLinkPipe implements PipeTransform {
  private cdRef = inject(ChangeDetectorRef)
  private resource$ = new Subject<NwLinkResource>()
  private category$ = new Subject<string>()
  private resourceId$ = new Subject<string>()
  private value$ = selectStream(
    {
      locale: inject(LocaleService).value$,
      resource: this.resource$,
      category: this.category$,
      resourceId: this.resourceId$,
    },
    ({ locale, resource, category, resourceId }) => {
      return (
        buddyLinkUrl({
          id: resourceId,
          type: resource,
          category: category,
          lang: locale,
          ptr: environment.isPTR,
        }) || ''
      )
    },
  )

  private value: string = ''

  public constructor() {
    this.value$.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe((value) => {
      this.value = value
      this.cdRef.markForCheck()
    })
  }

  public transform(input: [NwLinkResource, string | number] | [NwLinkResource], category?: string) {
    if (!input || (input.length === 2 && !input[1])) {
      this.category$.next(null)
      this.resource$.next(null)
      this.resourceId$.next(null)
      return null
    }
    this.category$.next(category || null)
    this.resource$.next(input[0])
    this.resourceId$.next(String(input[1] || ''))
    return this.value
  }
}
