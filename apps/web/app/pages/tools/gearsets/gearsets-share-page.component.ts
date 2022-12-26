import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { LetModule } from '@ngrx/component'
import { filter, map, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsDB } from '~/data'
import { NwModule } from '~/nw'
import { Web3Service } from '~/pages/web3'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { PromptDialogComponent } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { GearsetDetailComponent } from './gearset-detail.component'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-share-page',
  templateUrl: './gearsets-share-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, GearsetDetailComponent, LetModule, IconsModule],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsSharePageComponent {
  protected cid$ = observeRouteParam(this.route, 'cid')
  protected record$ = this.cid$.pipe(switchMap((cid) => this.web3.readObject(cid))).pipe(
    map((it): GearsetRecord => {
      if (it.type === 'gearset') {
        const record: GearsetRecord = it.data
        delete record.id
        return record
      }
      return null
    })
  )

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: Web3Service,
    private dialog: Dialog,
    private gearsetDb: GearsetsDB
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
          relativeTo: this.route
        })
      })
  }
}
