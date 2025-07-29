import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { filter, switchMap } from 'rxjs'
import { TransmogsService } from '~/data/transmogs'
import { PreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgLink } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { PlatformService } from '~/utils/services/platform.service'
import { TransmogEditorComponent, TransmogEditorState } from './transmog-editor'

@Component({
  selector: 'nwb-transmog-set-new',
  templateUrl: './transmog-set-new.component.html',
  imports: [TransmogEditorComponent, LayoutModule, IconsModule, TooltipModule, FormsModule],
  host: {
    class: 'ion-page',
  },
})
export class TransmogSetNewComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private modal = inject(ModalService)
  private service = inject(TransmogsService)
  private preferences = inject(PreferencesService)
  private platform = inject(PlatformService)

  protected encodedState: string = null
  protected iconLink = svgLink
  protected iconCamera = svgCamera

  protected value: TransmogEditorState

  public constructor() {
    const queryState = convertState(decodeState(this.route.snapshot.queryParamMap.get('state')))
    const sessionState = convertState(this.preferences.session.get('transmog-editor'))
    this.value = queryState || sessionState || null
    if (queryState) {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { state: null },
      })
    }
  }

  protected handleStateChange(value: any) {
    this.preferences.session.set('transmog-editor', value)
    this.encodedState = encodeState(value)
  }

  protected copyLink() {
    const url = new URL(this.router.url, this.platform.websiteUrl)
    url.searchParams.set('state', this.encodedState)
    navigator.clipboard.writeText(url.toString())
    this.modal.showToast({
      message: 'Link copied to clipboard',
      duration: 2000,
      position: 'top',
    })
  }

  protected handleSaveAsClicked() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Save as',
        body: 'Give it a name',
        value: 'New Transmog',
        positive: 'Save',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => it != null),
        switchMap((name) => {
          return this.service.create({
            id: null,
            name,
            gender: this.value.gender,
            slots: {
              head: this.value.head,
              chest: this.value.chest,
              hands: this.value.hands,
              legs: this.value.legs,
              feet: this.value.feet,
            },
          })
        }),
      )
      .subscribe({
        next: (record) => {
          this.modal.showToast({
            message: 'Saved',
            duration: 2000,
            position: 'bottom',
            color: 'success',
          })
          this.router.navigate(['transmog', 'sets', record.userId, record.id])
        },
        error: () => {
          this.modal.showToast({
            message: 'Failed to save transmog set',
            duration: 2000,
            position: 'bottom',
            color: 'danger',
          })
        },
      })
  }
}

function decodeState(state: string): TransmogEditorState {
  if (!state) {
    return null
  }
  try {
    return JSON.parse(decompressFromEncodedURIComponent(state))
  } catch (e) {
    console.error('Failed to decode state', e)
    return null
  }
}

function encodeState(state: any) {
  return compressToEncodedURIComponent(JSON.stringify(state))
}

function convertState(value: any): TransmogEditorState {
  if (!value) {
    return null
  }
  return {
    debug: false,
    gender: value.gender,
    head: {
      item: value.head?.item ?? value.head?.t,
      dyeR: value.head?.dyeR ?? value.head?.r,
      dyeG: value.head?.dyeG ?? value.head?.g,
      dyeB: value.head?.dyeB ?? value.head?.b,
      dyeA: value.head?.dyeA ?? value.head?.a,
      flag: value.head?.flag ?? value.head?.h,
    },
    chest: {
      item: value.chest?.item ?? value.chest?.t,
      dyeR: value.chest?.dyeR ?? value.chest?.r,
      dyeG: value.chest?.dyeG ?? value.chest?.g,
      dyeB: value.chest?.dyeB ?? value.chest?.b,
      dyeA: value.chest?.dyeA ?? value.chest?.a,
      flag: value.chest?.flag ?? value.chest?.h,
    },
    hands: {
      item: value.hands?.item ?? value.hands?.t,
      dyeR: value.hands?.dyeR ?? value.hands?.r,
      dyeG: value.hands?.dyeG ?? value.hands?.g,
      dyeB: value.hands?.dyeB ?? value.hands?.b,
      dyeA: value.hands?.dyeA ?? value.hands?.a,
      flag: value.hands?.flag ?? value.hands?.h,
    },
    legs: {
      item: value.legs?.item ?? value.legs?.t,
      dyeR: value.legs?.dyeR ?? value.legs?.r,
      dyeG: value.legs?.dyeG ?? value.legs?.g,
      dyeB: value.legs?.dyeB ?? value.legs?.b,
      dyeA: value.legs?.dyeA ?? value.legs?.a,
      flag: value.legs?.flag ?? value.legs?.h,
    },
    feet: {
      item: value.feet?.item ?? value.feet?.t,
      dyeR: value.feet?.dyeR ?? value.feet?.r,
      dyeG: value.feet?.dyeG ?? value.feet?.g,
      dyeB: value.feet?.dyeB ?? value.feet?.b,
      dyeA: value.feet?.dyeA ?? value.feet?.a,
      flag: value.feet?.flag ?? value.feet?.h,
    },
  }
}
