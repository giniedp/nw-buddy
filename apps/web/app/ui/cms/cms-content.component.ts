import { CommonModule } from '@angular/common'
import { Component, Input, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { catchError, map, of, pipe, switchMap } from 'rxjs'
import { RichTextOutletDirective } from './blocks'
import { CmsContentService } from './cms-content.service'

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
    catchError((err) => {
      console.error(err)
      return of(null)
    }),
  )

  public constructor() {
    super({ contentPath: '' })
  }
}
