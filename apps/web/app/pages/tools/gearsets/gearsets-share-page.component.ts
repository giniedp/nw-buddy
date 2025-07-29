import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsService } from '~/data'
import { ShareLoaderComponent } from '~/pages/share'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { injectQueryParam, injectRouteParam } from '~/utils'
import { EmbedHeightDirective } from '~/utils/directives/embed-height.directive'
import { GearsetGridComponent } from './gearset/gearset-grid.component'
import { GearsetHostDirective } from './gearset/gearset-host.directive'
import { GearsetSliderComponent } from './gearset/gearset-slider.component'

@Component({
  selector: 'nwb-gearsets-share-page',
  templateUrl: './gearsets-share-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GearsetHostDirective,
    GearsetGridComponent,
    GearsetSliderComponent,
    LayoutModule,
    EmbedHeightDirective,
    ShareLoaderComponent,
  ],
  host: {
    class: 'ion-page',
  },
})
export class GearsetsSharePageComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private modal = inject(ModalService)
  private gearService = inject(GearsetsService)

  protected paramName = toSignal(injectRouteParam('name'))
  protected paramCid = toSignal(injectRouteParam('cid'))
  protected paramMode = toSignal(injectQueryParam('mode'))
  protected get isEmbed() {
    return this.router.url.includes('embed')
  }
  protected get showGrid() {
    return !this.isEmbed || this.paramMode() === 'grid'
  }

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  public constructor() {
    //
  }

  protected onImportClicked(record: GearsetRecord) {
    record = { ...record, id: null }
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import',
        label: 'Name',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.gearService.create({
            ...record,
            name: name,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate(['/gearsets', record.id], {
          replaceUrl: true,
          relativeTo: this.route,
        })
      })
  }
}
