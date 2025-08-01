import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { ToastController } from '@ionic/angular/standalone'
import { AttributeRef } from '@nw-data/common'
import { combineLatest, filter, switchMap } from 'rxjs'
import { SkillTreeRecord, SkillTreesService, SkillTreeStore } from '~/data'
import { NwModule } from '~/nw'
import { ShareDialogComponent } from '~/pages/share'
import { ChipsInputModule } from '~/ui/chips-input'
import { IconsModule } from '~/ui/icons'
import {
  svgArrowRightArrowLeft,
  svgBars,
  svgClipboard,
  svgExclamation,
  svgGlobe,
  svgInfoCircle,
  svgShareNodes,
  svgSliders,
  svgTags,
  svgTrashCan,
  svgXmark,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { SyncBadgeComponent } from '~/ui/sync-badge'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectParentRouteParam, injectRouteParam } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillTreeEditorComponent, SkillTreeValue } from '~/widgets/skill-tree'
import { EmbedHeightDirective } from '../../../utils/directives'
import { GEARSET_TAGS } from '../gearsets/tags'

@Component({
  selector: 'nwb-skill-tree-detail',
  templateUrl: './skill-tree-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    RouterModule,
    SkillTreeEditorComponent,
    IconsModule,
    ScreenshotModule,
    TooltipModule,
    LayoutModule,
    AttributesEditorModule,
    ChipsInputModule,
    SyncBadgeComponent,
  ],
  providers: [SkillTreeStore],
  hostDirectives: [EmbedHeightDirective],
  host: {
    class: 'ion-page bg-base-300',
  },
})
export class SkillTreeDetailComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private modal = inject(ModalService)
  private platform = inject(PlatformService)
  private toast = inject(ToastController)
  private store = inject(SkillTreeStore)
  private service = inject(SkillTreesService)

  private userId = injectParentRouteParam('userid')
  private recordId = injectRouteParam('id')

  protected record = this.store.skillTree
  protected isLoading = this.store.isLoading
  protected canEdit = this.store.isEditable
  protected hasError = this.store.hasError
  protected isPublic = this.store.isPublished
  protected isSyncable = this.store.isSyncable
  protected isSynced = this.store.isSyncComplete
  protected isPending = this.store.isSyncPending
  protected isConflict = this.store.isSyncConflict
  protected canImport = this.store.isImportable
  protected isEmbed = computed(() => this.platform.isEmbed)

  protected iconBack = svgXmark
  protected iconReset = svgArrowRightArrowLeft
  protected iconMenu = svgBars
  protected iconAttrs = svgSliders
  protected iconShare = svgShareNodes
  protected iconCopy = svgClipboard
  protected iconDelete = svgTrashCan
  protected iconTags = svgTags
  protected iconError = svgExclamation
  protected iconInfo = svgInfoCircle
  protected iconGlobe = svgGlobe
  protected isTagEditorOpen = false
  protected presetTags = GEARSET_TAGS.map((it) => it.value)

  protected builder = viewChild(SkillTreeEditorComponent)

  public constructor(head: HtmlHeadService) {
    this.store.connect(
      combineLatest({
        userId: this.userId,
        recordId: this.recordId,
      }),
    )

    head.updateMetadata({
      title: 'Skill Build',
      description: 'A custom skill build',
      noIndex: true,
      noFollow: true,
    })
  }

  protected updateModel(data: SkillTreeValue) {
    const record = this.record()
    if (!record) {
      return
    }
    this.service.update(record.id, {
      ...record,
      weapon: data.weapon,
      tree1: data.tree1,
      tree2: data.tree2,
    })
  }

  protected handleImportClicked() {
    const record = this.record()
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import Skill Tree',
        label: 'Name',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.service.dublicate({
            ...record,
            name: newName,
          })
        }),
      )
      .subscribe({
        next: (newSet) => {
          this.router.navigate(['/skill-trees', newSet.userId, newSet.id])
          this.toast
            .create({
              message: 'Skill tree imported successfully',
              duration: 3000,
              color: 'success',
            })
            .then((toast) => toast.present())
        },
        error: (error) => {
          console.error(error)
          this.toast
            .create({
              message: 'Failed to import skill tree',
              duration: 3000,
              color: 'danger',
            })
            .then((toast) => toast.present())
        },
      })
  }

  protected handleUpdateName(name: string) {
    this.service.update(this.record().id, {
      ...this.record(),
      name: name,
    })
  }

  protected handleUpdateAttributes(attrs: Record<AttributeRef, number>) {
    this.service.update(this.record().id, {
      ...this.record(),
      attrs: attrs,
    })
  }

  protected handleToggleAttributes() {
    const record = this.record()
    this.service.update(record.id, {
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
    this.service.update(this.record().id, {
      ...this.record(),
      tags: tags || [],
    })
  }

  protected handlePublish() {
    this.service
      .update(this.record().id, {
        status: 'public',
      })
      .then(() => {
        this.toast
          .create({
            message: 'Skill tree published successfully',
            duration: 3000,
            color: 'success',
          })
          .then((toast) => toast.present())
      })
      .catch(() => {
        this.toast
          .create({
            message: 'Failed to publish skill tree',
            duration: 3000,
            color: 'danger',
          })
          .then((toast) => toast.present())
      })
  }

  protected handleUnpublish() {
    this.service
      .update(this.record().id, {
        status: 'private',
      })
      .then(() => {
        this.toast
          .create({
            message: 'Skill tree unpublished successfully',
            duration: 3000,
            color: 'success',
          })
          .then((toast) => toast.present())
      })
      .catch(() => {
        this.toast
          .create({
            message: 'Failed to unpublish skill tree',
            duration: 3000,
            color: 'danger',
          })
          .then((toast) => toast.present())
      })
  }

  protected handleShare() {
    const ipnsKey = this.record().ipnsKey
    const ipnsName = this.record().ipnsName
    const record = cloneRecord(this.record())

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
            return [
              `<script src="${this.platform.websiteUrl}/embed.js"></script>`,
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
            this.service.update(record.id, {
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
        label: 'Name',
        value: `${this.record().name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.service.dublicate({
            ...this.record(),
            name,
          })
        }),
      )
      .subscribe({
        next: ({ id }) => {
          this.router.navigate(['..', id], { relativeTo: this.route })
        },
        error: (error) => {
          console.error(error)
          this.toast
            .create({
              message: 'Failed to clone skill tree',
              duration: 3000,
              color: 'danger',
            })
            .then((toast) => toast.present())
        },
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
      .result$.pipe(
        filter((it) => !!it),
        switchMap(() => this.service.delete(this.record().id)),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['..'], { relativeTo: this.route })
          this.toast
            .create({
              message: 'Skill tree deleted successfully',
              duration: 3000,
              color: 'success',
            })
            .then((toast) => toast.present())
        },
        error: (error) => {
          console.error(error)
          this.toast
            .create({
              message: 'Failed to delete skill tree',
              duration: 3000,
              color: 'danger',
            })
            .then((toast) => toast.present())
        },
      })
  }
}

function cloneRecord(record: SkillTreeRecord) {
  record = JSON.parse(JSON.stringify(record))
  delete record.ipnsKey
  delete record.ipnsName
  return record
}
