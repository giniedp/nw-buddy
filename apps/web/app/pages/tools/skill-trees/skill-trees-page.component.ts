import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { filter, map, switchMap } from 'rxjs'
import { SkillBuildRow, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, observeQueryParam, selectStream } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { SkillsetTableAdapter } from '~/widgets/data/skillset-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-skill-trees-page',
  templateUrl: './skill-trees-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    ScreenshotModule,
    IonHeader,
    TooltipModule,
    DataViewModule,
    DataGridModule,
    ItemDetailModule,
    VirtualGridModule,
    LayoutModule,
    IconsModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    provideDataView({
      adapter: SkillsetTableAdapter,
      factory: () => {
        return {
          source: inject(SkillBuildsStore).selectedRows$,
        }
      },
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class SkillBuildsComponent {
  protected title = 'Skill Trees'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'skilltrees-table'
  protected categoryParam = 'category'
  protected categoryParam$ = observeQueryParam(inject(ActivatedRoute), this.categoryParam)
  protected category$ = selectStream(this.categoryParam$, (it) => {
    return it ? it : null
  })

  protected iconCreate = svgPlus
  protected iconMore = svgEllipsisVertical
  protected tags$ = this.store.tags$

  private router = inject(Router)
  private route = inject(ActivatedRoute)

  public constructor(
    private store: SkillBuildsStore,
    protected search: QuicksearchService,
    private dialog: Dialog,
    private injector: Injector,
    protected service: DataViewService<any>,
    head: HtmlHeadService,
  ) {
    service.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      title: 'Skill Builder',
      description: 'A Skill Buider tool for New World. Build your skill tree and share with your mates.',
    })
  }

  protected async createItem() {
    openWeaponTypePicker({
      dialog: this.dialog,
      injector: this.injector,
    })
      .closed.pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .pipe(
        switchMap((weapon) => {
          return this.store.createRecord({
            record: {
              id: null,
              name: `New Skill Tree`,
              tree1: null,
              tree2: null,
              weapon: weapon.WeaponTag,
            },
          })
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.router.navigate(['.', result.id], { relativeTo: this.route })
        }
      })
  }

  protected deleteItem(item: SkillBuildRow) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Skill Tree',
        body: 'Are you sure you want to delete this skill tree?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.store.destroyRecord({ recordId: item.record.id })
      })
  }

  protected toggleTag(value: string) {
    console.log('toggleTag', value)
    this.store.toggleTag(value)
  }
}
