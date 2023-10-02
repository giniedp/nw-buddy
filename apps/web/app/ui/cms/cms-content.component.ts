import { Component, Input, inject } from '@angular/core'
import { RichTextOutletDirective } from './blocks'
import { ComponentStore } from '@ngrx/component-store'
import { CmsContentService } from './cms-content.service'
import { catchError, map, of, pipe, switchMap } from 'rxjs'
import { CommonModule } from '@angular/common'
import { tapDebug } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-cms-content',
  template: ` <ng-container [nwbRichTextContent]="content$ | async"></ng-container> `,
  imports: [CommonModule, RichTextOutletDirective],
})
export class CmsContentComponent extends ComponentStore<{ contentPath: string }> {
  @Input()
  public set contentPath(value: string) {
    this.patchState({ contentPath: value })
  }

  protected service = inject(CmsContentService)

  protected content$ = this.select(({ contentPath }) => contentPath).pipe(
    switchMap((contentPath) => {
      if (!contentPath) {
        return of(null)
      }
      return this.service.getContent(contentPath)
    }),
    pipe(map((it) => it.children)),
    tapDebug('content$'),
    catchError((err) => {
      console.error(err)
      return of(null)
    })
  )

  public constructor() {
    super({ contentPath: '' })
  }
}
