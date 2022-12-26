import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { asyncScheduler, combineLatest, filter, map, subscribeOn, switchMap } from 'rxjs'
import { SkillBuildRecord, SkillBuildsDB, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { AttributeRef } from '~/nw/attributes'
import { ShareDialogComponent, Web3Service } from '~/pages/web3'
import { IconsModule } from '~/ui/icons'
import {
  svgArrowRightArrowLeft,
  svgBars,
  svgChevronLeft,
  svgClipboard,
  svgRotate,
  svgShareNodes,
  svgSliders,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillBuilderComponent, SkillBuildValue } from '~/widgets/skill-builder'

@Component({
  standalone: true,
  selector: 'nwb-skill-builds-detail',
  templateUrl: './skill-builds-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    RouterModule,
    SkillBuilderComponent,
    IconsModule,
    ScreenshotModule,
    TooltipModule,
    LayoutModule,
    AttributesEditorModule,
  ],
  host: {
    class: 'hidden xl:flex xl:flex-1 flex-col',
  },
})
export class SkillBuildsDetailComponent {
  protected item$ = combineLatest({
    id: observeRouteParam(this.route, 'id'),
    rows: this.store.whenLoaded$.pipe(switchMap(() => this.store.rows$)),
  })
    .pipe(subscribeOn(asyncScheduler))
    .pipe(
      map(({ id, rows }) => {
        const found = rows?.find((it) => it.record.id === id)
        return found
      })
    )

  protected attrs$ = this.item$.pipe(map((it) => it?.record?.attrs))
  protected iconBack = svgChevronLeft
  protected iconReset = svgArrowRightArrowLeft
  protected iconMenu = svgBars
  protected iconAttrs = svgSliders
  protected iconShare = svgShareNodes
  protected iconCopy = svgClipboard
  protected iconDelete = svgTrashCan

  public constructor(
    private store: SkillBuildsStore,
    private skillDb: SkillBuildsDB,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: Dialog
  ) {
    //
  }

  protected updateModel(record: SkillBuildRecord, data: SkillBuildValue) {
    this.store.updateRecord({
      record: {
        ...record,
        weapon: data.weapon,
        tree1: data.tree1,
        tree2: data.tree2,
      },
    })
  }

  protected updateName(record: SkillBuildRecord, name: string) {
    this.store.updateRecord({
      record: {
        ...record,
        name: name,
      },
    })
  }

  protected updateAttributes(record: SkillBuildRecord, attrs: Record<AttributeRef, number>) {
    this.store.updateRecord({
      record: {
        ...record,
        attrs: attrs,
      },
    })
  }

  protected toggleAttributes(record: SkillBuildRecord) {
    this.store.updateRecord({
      record: {
        ...record,
        attrs: record.attrs
          ? null
          : {
              con: 0,
              dex: 0,
              foc: 0,
              int: 0,
              str: 0,
            },
      },
    })
  }

  protected onShareClicked(record: SkillBuildRecord) {
    ShareDialogComponent.open(this.dialog, {
      data: {
        buildUrl: (cid) => {
          return this.router
            .createUrlTree(['..', 'share', cid], {
              relativeTo: this.route,
            })
            .toString()
        },
        data: {
          ref: record.id,
          type: 'skill-build',
          data: record,
        },
      },
    })
  }

  protected async onCloneClicked(record: SkillBuildRecord) {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create copy',
        body: 'New skill-tree name',
        input: `${record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.skillDb.create({
            ...record,
            id: null,
            name: name,
          })
        })
      )
      .subscribe((result) => {
        this.store.notifyCreated(result)
        this.router.navigate(['..', result.id], { relativeTo: this.route })
      })
  }

  protected onDeleteClicked(record: SkillBuildRecord) {
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
        this.store.destroyRecord({ recordId: record.id })
        this.router.navigate(['..'], {
          relativeTo: this.route,
        })
      })
  }
}
