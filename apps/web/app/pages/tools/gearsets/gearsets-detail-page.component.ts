import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { LetModule } from '@ngrx/component'
import { combineLatest, filter, firstValueFrom, map, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsDB, ItemInstance, ItemInstancesDB } from '~/data'
import { ShareDialogComponent } from '~/pages/share'
import { ChipsInputModule } from '~/ui/chips-input'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgChevronLeft, svgCompress, svgPaste, svgShareNodes, svgTags, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { observeRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetDetailComponent } from './gearset-detail.component'
import { GEARSET_TAGS } from './tags'
import { ImagesDB } from '~/data/images.db'
import { environment } from 'apps/web/environments'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-detail-page',
  templateUrl: './gearsets-detail-page.component.html',
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    IconsModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    IonicModule,
    GearsetDetailComponent,
    LetModule,
    ChipsInputModule,
    OverlayModule,

  ],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsDetailPageComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected record$ = this.gearDb.observeByid(this.id$)

  protected vm$ = combineLatest({
    record: this.record$,
    name: this.record$.pipe(map((it) => it?.name)),
    tags: this.record$.pipe(map((it) => it?.tags || [])),
  })

  protected compact = false
  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  protected iconCopy = svgPaste
  protected iconBack = svgChevronLeft
  protected iconCompact = svgCompress
  protected iconShare = svgShareNodes
  protected iconTags = svgTags
  protected presetTags = GEARSET_TAGS.map((it) => it.value)
  protected isTagEditorOpen = false
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gearDb: GearsetsDB,
    private itemsDb: ItemInstancesDB,
    private imagesDb: ImagesDB,
    private dialog: Dialog
  ) {}

  protected async updateName(value: string) {
    const record = await firstValueFrom(this.record$)
    this.gearDb.update(record.id, {
      ...record,
      name: value,
    })
  }

  protected onCompactClicked() {
    this.compact = !this.compact
  }

  protected async onCloneClicked() {
    const record = await firstValueFrom(this.record$)
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create copy',
        body: 'New gearset name',
        input: `${record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearDb.create({
            ...record,
            id: null,
            ipnsKey: null,
            ipnsName: null,
            name: newName,
          })
        })
      )
      .subscribe((newSet) => {
        this.router.navigate(['..', newSet.id], { relativeTo: this.route })
      })
  }

  protected async onDeleteClicked() {
    const record = await firstValueFrom(this.record$)
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        if (record.imageId) {
          this.imagesDb.destroy(record.imageId)
        }
        if (record.id) {
          this.gearDb.destroy(record.id)
        }
        this.router.navigate(['..'], { relativeTo: this.route })
      })
  }

  protected async onShareClicked() {
    let record = await firstValueFrom(this.record$)
    const ipnsKey = record.ipnsKey
    const ipnsName = record.ipnsName
    record = { ...record }
    delete record.imageId
    delete record.createMode
    delete record.ipnsKey
    delete record.ipnsName

    for (const [slot, it] of Object.entries(record.slots)) {
      if (typeof it === 'string') {
        record.slots[slot] = await this.itemsDb
          .read(it)
          .then((it): ItemInstance => {
            return {
              gearScore: it.gearScore,
              itemId: it.itemId,
              perks: it.perks,
            }
          })
          .catch(() => null as ItemInstance)
      }
    }

    ShareDialogComponent.open(this.dialog, {
      data: {
        ipnsKey: ipnsKey,
        ipnsName: ipnsName,
        content: {
          ref: record.id,
          type: 'gearset',
          data: record,
        },
        published: (res) => {
          if (res.ipnsKey) {
            this.gearDb.update(record.id, {
              ipnsName: res.ipnsName,
              ipnsKey: res.ipnsKey,
            })
          }
        },
        buildEmbedSnippet: (url: string) => {
          if (!url) {
            return null
          }
          const host = environment.standalone ? "https://www.nw-buddy.de" : location.origin
          return [
            `<script src="${host}/embed.js"></script>`,
            `<object data="${url}" style="width: 100%"></object>`
          ].join('\n')
        },
        buildEmbedUrl: (cid, name) => {
          if (!cid && !name) {
            return null
          }
          const command = name ? ['../embed/ipns', name] : ['../embed/ipfs', cid]
          return this.router
            .createUrlTree(command, {
              relativeTo: this.route,
            })
            .toString()
        },
        buildShareUrl: (cid, name) => {
          if (!cid && !name) {
            return null
          }
          const command = name ? ['../share/ipns', name] : ['../share/ipfs', cid]
          return this.router
            .createUrlTree(command, {
              relativeTo: this.route,
            })
            .toString()
        },
      },
    })
  }

  protected updateTags(record: GearsetRecord, tags: string[]) {
    this.gearDb.update(record.id, {
      ...record,
      tags: tags || [],
    })
  }

  protected goBack() {
    history.back()
  }
}
