import { Component, computed, effect, inject, viewChild } from '@angular/core'
import { rxResource, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { filter, of } from 'rxjs'
import { BackendService } from '~/data/backend'
import { TransmogsService, TransmogStore } from '~/data/transmogs'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgCamera,
  svgChevronLeft,
  svgGlobe,
  svgInfoCircle,
  svgShareNodes,
  svgTags,
  svgTrashCan,
} from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectParentRouteParam, injectRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SyncBadgeComponent } from '~/ui/sync-badge'
import { NgTemplateOutlet } from '@angular/common'
import { CharacterEditorComponent } from './character-editor/character-editor.component'
import type { CharacterEditorValue } from './character-editor/character-editor.store'

@Component({
  selector: 'nwb-transmog-set-detail',
  templateUrl: './transmog-set-detail.component.html',
  imports: [
    LayoutModule,
    CharacterEditorComponent,
    NgTemplateOutlet,
    FormsModule,
    IconsModule,
    RouterModule,
    TooltipModule,
    ScreenshotModule,
    SyncBadgeComponent,
  ],
  providers: [TransmogStore],
  host: {
    class: 'ion-page',
  },
})
export class TransmogSetDetailComponent {
  private backend = inject(BackendService)
  private store = inject(TransmogStore)
  private service = inject(TransmogsService)
  private modal = inject(ModalService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  private paramUserId = toSignal(injectParentRouteParam('userid'))
  private paramRecordId = toSignal(injectRouteParam('id'))
  protected resource = rxResource({
    params: () => {
      return {
        userId: this.paramUserId(),
        id: this.paramRecordId(),
      }
    },
    stream: ({ params: { userId, id } }) => {
      if (!userId && !id) {
        return of(null)
      }
      return this.service.observeRecord({ userId, id })
    },
  })
  protected iconBack = svgChevronLeft
  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  // protected iconCopy = svgPaste
  // protected iconBack = svgChevronLeft
  // protected iconClose = svgXmark
  protected iconInfo = svgInfoCircle
  protected iconShare = svgShareNodes
  protected iconTags = svgTags
  protected iconMenu = svgBars
  // protected iconReset = svgEraser
  // protected iconSwords = svgSwords
  protected iconGlobe = svgGlobe

  protected record = this.store.record
  protected isEditable = computed(() => !!this.record() && this.store.isOwned())
  protected isPublic = this.store.isPublished
  protected isOwned = this.store.isOwned
  protected isSyncPending = this.store.isSyncPending
  protected isSyncConflict = this.store.isSyncConflict
  protected isSyncable = this.store.isSyncable
  protected isSignedIn = this.backend.isSignedIn
  protected isLoading = this.resource.isLoading
  protected hasError = computed(() => this.resource.error())
  private characterEditor = viewChild(CharacterEditorComponent)

  protected editorState = computed((): CharacterEditorValue => {
    if (!this.record()) {
      return null
    }
    const value = this.record()
    return {
      gender: value.gender,
      emote: value.emote ?? null,
      weapons: value.weapons ?? null,
      head: value.slots?.head,
      chest: value.slots?.chest,
      hands: value.slots?.hands,
      legs: value.slots?.legs,
      feet: value.slots?.feet,
    }
  })

  public constructor() {
    this.store.connectById(
      computed(() => {
        return {
          userId: this.paramUserId(),
          id: this.paramRecordId(),
        }
      }),
    )
  }

  protected capturePhoto() {
    this.characterEditor()?.capturePhoto()
  }

  protected handleNameChange(value: string) {
    this.service.update(this.record().id, {
      name: value,
    })
  }

  protected handleStateChange(value: CharacterEditorValue) {
    this.service.update(this.record().id, {
      gender: value.gender,
      slots: {
        head: value.head,
        chest: value.chest,
        hands: value.hands,
        legs: value.legs,
        feet: value.feet,
      },
      emote: value.emote || null,
      weapons: value.weapons || null,
    })
  }

  protected handleUnpublish() {
    this.service.unpublish(this.record())
  }

  protected handlePublish() {
    this.service.publish(this.record())
  }

  protected handleDelete() {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete',
        body: 'Are you sure you want to delete this set?',
        negative: 'Cancel',
        positive: 'Delete',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.service.delete(this.record().id)
        this.router.navigate(['..'], {
          relativeTo: this.route,
        })
      })
  }
}
