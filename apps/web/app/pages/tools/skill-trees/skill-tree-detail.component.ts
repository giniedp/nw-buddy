import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { AttributeRef } from '@nw-data/common'
import { environment } from 'apps/web/environments'
import { filter, switchMap } from 'rxjs'
import { SkillBuildsDB, SkillSetRecord } from '~/data'
import { NwModule } from '~/nw'
import { ShareDialogComponent } from '~/pages/share'
import { ChipsInputModule } from '~/ui/chips-input'
import { IconsModule } from '~/ui/icons'
import {
  svgArrowRightArrowLeft,
  svgBars,
  svgChevronLeft,
  svgClipboard,
  svgShareNodes,
  svgSliders,
  svgTags,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillBuildValue, SkillBuilderComponent } from '~/widgets/skill-builder'
import { GEARSET_TAGS } from '../gearsets/tags'
import { SkillTreeDetailStore } from './skill-tree-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-detail',
  templateUrl: './skill-tree-detail.component.html',
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
    ChipsInputModule,
  ],
  providers: [SkillTreeDetailStore],
  host: {
    class: 'block',
  },
})
export class SkillBuildsDetailComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private modal = inject(ModalService)

  private db = inject(SkillBuildsDB)
  private store = inject(SkillTreeDetailStore)
  private recordId$ = injectRouteParam('id')

  protected get canEdit() {
    return this.store.canEdit()
  }
  protected get record() {
    return this.store.record()
  }

  protected iconBack = svgChevronLeft
  protected iconReset = svgArrowRightArrowLeft
  protected iconMenu = svgBars
  protected iconAttrs = svgSliders
  protected iconShare = svgShareNodes
  protected iconCopy = svgClipboard
  protected iconDelete = svgTrashCan
  protected iconTags = svgTags
  protected isTagEditorOpen = false
  protected presetTags = GEARSET_TAGS.map((it) => it.value)

  public constructor(head: HtmlHeadService) {
    this.store.load(this.recordId$)
    this.store.setEditable(true)

    head.updateMetadata({
      title: 'Skill Build',
      description: 'A custom skill build',
      noIndex: true,
      noFollow: true,
    })
  }

  protected updateModel(data: SkillBuildValue) {
    const record = this.record
    if (!record) {
      return
    }
    this.store.update({
      ...record,
      weapon: data.weapon,
      tree1: data.tree1,
      tree2: data.tree2,
    })
  }

  protected handleUpdateName(name: string) {
    this.store.update({
      ...this.record,
      name: name,
    })
  }

  protected handleUpdateAttributes(attrs: Record<AttributeRef, number>) {
    this.store.update({
      ...this.record,
      attrs: attrs,
    })
  }

  protected handleToggleAttributes() {
    const record = this.record
    this.store.update({
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
    })
  }

  protected handleUpdateTags(tags: string[]) {
    this.store.update({
      ...this.record,
      tags: tags || [],
    })
  }

  protected handleShare() {
    const ipnsKey = this.record.ipnsKey
    const ipnsName = this.record.ipnsName
    const record = cloneRecord(this.record)

    ShareDialogComponent.open(this.modal, {
      inputs: {
        data: {
          ipnsKey: ipnsKey,
          ipnsName: ipnsName,
          content: {
            ref: record.id,
            type: 'skill-build',
            data: record,
          },
          buildEmbedSnippet: (url: string) => {
            if (!url) {
              return null
            }
            const host = environment.standalone ? 'https://www.nw-buddy.de' : location.origin
            return [
              `<script src="${host}/embed.js"></script>`,
              `<object data="${url}" style="width: 100%"></object>`,
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
          published: (res) => {
            if (!res.ipnsKey) {
              return
            }
            this.store.update({
              ...record,
              ipnsKey: res.ipnsKey,
              ipnsName: res.ipnsName,
            })
          },
        },
      },
    })
  }

  protected async handleClone() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create copy',
        body: 'New skill-tree name',
        value: `${this.record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.db.create({
            ...cloneRecord(this.record),
            id: null,
            name: name,
          })
        }),
      )
      .subscribe((result) => {
        this.router.navigate(['..', result.id], { relativeTo: this.route })
      })
  }

  protected handleDelete() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete Skill Tree',
        body: 'Are you sure you want to delete this skill tree?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.store.destroy()
        this.router.navigate(['..'], {
          relativeTo: this.route,
        })
      })
  }
}

function cloneRecord(record: SkillSetRecord) {
  record = JSON.parse(JSON.stringify(record))
  delete record.ipnsKey
  delete record.ipnsName
  return record
}
