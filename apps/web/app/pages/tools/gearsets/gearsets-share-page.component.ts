import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from 'apps/web/environments'
import { filter, map, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsDB } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { suspensify } from '~/utils'
import { EmbedHeightDirective } from '~/utils/directives/embed-height.directive'
import { GearsetGridComponent } from './gearset/gearset-grid.component'
import { GearsetHostDirective } from './gearset/gearset-host.directive'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-share-page',
  templateUrl: './gearsets-share-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    GearsetHostDirective,
    GearsetGridComponent,
    IconsModule,
    LayoutModule,
    EmbedHeightDirective,
  ],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsSharePageComponent {
  protected record$ = this.route.paramMap.pipe(
    switchMap((it) => {
      if (it.has('cid')) {
        return this.web3.downloadbyCid(it.get('cid'))
      }
      return this.web3.downloadByName(it.get('name'))
    }),
    map((it): GearsetRecord => {
      if (it.type === 'gearset') {
        const record: GearsetRecord = it.data
        delete record.id
        return record
      }
      return null
    }),
    suspensify(),
  )

  protected get appLink() {
    if (environment.standalone) {
      return null
    }
    return this.sanitizer.bypassSecurityTrustUrl(`nw-buddy://${this.router.url}`)
  }
  protected get isEmbed() {
    return this.router.url.includes('embed')
  }

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: ShareService,
    private modal: ModalService,
    private gearsetDb: GearsetsDB,
    private sanitizer: DomSanitizer,
  ) {
    //
  }

  protected onimportClicked(record: GearsetRecord) {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import',
        body: 'New gearset name',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.gearsetDb.create({
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
