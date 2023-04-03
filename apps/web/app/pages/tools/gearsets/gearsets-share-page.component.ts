import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { LetModule } from '@ngrx/component'
import { environment } from 'apps/web/environments'
import { filter, map, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsDB } from '~/data'
import { ElectronService } from '~/electron'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { PromptDialogComponent } from '~/ui/layout'
import { GearsetDetailComponent } from './gearset-detail.component'
import { EmbedHeightDirective } from '~/utils/embed-height.directive'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-share-page',
  templateUrl: './gearsets-share-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearsetDetailComponent, LetModule, IconsModule, EmbedHeightDirective],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsSharePageComponent {
  protected record$ = this.route.paramMap
    .pipe(
      switchMap((it) => {
        if (it.has('cid')) {
          return this.web3.downloadbyCid(it.get('cid'))
        }
        return this.web3.downloadByName(it.get('name'))
      })
    )
    .pipe(
      map((it): GearsetRecord => {
        if (it.type === 'gearset') {
          const record: GearsetRecord = it.data
          delete record.id
          return record
        }
        return null
      })
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
    private dialog: Dialog,
    private gearsetDb: GearsetsDB,
    private electron: ElectronService,
    private sanitizer: DomSanitizer
  ) {
    //
  }

  protected onimportClicked(record: GearsetRecord) {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Import',
        body: 'New gearset name',
        input: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.gearsetDb.create({
            ...record,
            name: name,
          })
        })
      )
      .subscribe((record) => {
        this.router.navigate(['../..', record.id], {
          replaceUrl: true,
          relativeTo: this.route,
        })
      })
  }
}
