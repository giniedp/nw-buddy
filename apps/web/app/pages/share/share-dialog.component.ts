import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { environment } from 'apps/web/environments/environment'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import {
  svgCircleCheck,
  svgCircleExclamation,
  svgCircleNotch,
  svgCopy,
  svgInfoCircle,
  svgShareNodes,
} from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { UploadContent, ShareService } from './share.service'
import { AppPreferencesService } from '~/preferences'
import { RouterModule } from '@angular/router'
import { combineLatest, map } from 'rxjs'

export interface ShareOptions {
  /**
   * The ipns private key for the given content
   */
  ipnsKey?: string
  /**
   * The ipns name from a previous share
   */
  ipnsName?: string
  /**
   * The content to share
   */
  content: UploadContent<any>
  /**
   * Generates a share URL for a given ipfs CID cid or ipns name
   */
  buildShareUrl: (cid: string, ipnsName?: string) => string
  /**
   * Generates a share URL for a given ipfs CID cid or ipns name
   */
  buildEmbedUrl: (cid: string, ipnsName?: string) => string
  /**
   * Generates an embed code snippet
   */
  buildEmbedSnippet: (embedUrl: string) => string
  /**
   *
   */
  published: (options: { cid: string; ipnsName: string; ipnsKey: string }) => void
}

export interface ShareDialogState {
  active: boolean
  ipnsEnabled?: boolean
  ipnsKey?: string
  ipnsName?: string
  web3Enabled?: boolean
  web3Token?: string

  error?: boolean
  ipfsCid?: string
  shared?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-share-dialog',
  templateUrl: './share-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, TooltipModule, RouterModule, FormsModule],
  host: {
    class: 'flex flex-col bg-base-100 border border-base-100 rounded-md overflow-hidden h-full w-full m-2',
  },
})
export class ShareDialogComponent extends ComponentStore<ShareDialogState> {
  public static open(dialog: Dialog, config: DialogConfig<ShareOptions>) {
    return dialog.open(ShareDialogComponent, {
      panelClass: ['max-h-screen', 'w-screen', 'max-w-md'],
      ...config,
    })
  }

  protected iconInfo = svgInfoCircle
  protected iconError = svgCircleExclamation
  protected iconSuccess = svgCircleCheck
  protected iconShare = svgShareNodes
  protected iconCopy = svgCopy
  protected iconSpinner = svgCircleNotch
  protected shareUrl$ = this.select(({ ipfsCid, ipnsName }) => this.buildShareUrl(ipfsCid, ipnsName))
  protected embedUrl$ = this.select(({ ipfsCid, ipnsName }) => this.buildEmbedUrl(ipfsCid, ipnsName))
  protected embedSnippet$ = this.select(this.embedUrl$, (url) => this.data.buildEmbedSnippet?.(url))
  protected vm$ = combineLatest({
    state: this.state$,
    shareUrl: this.shareUrl$,
    embedUrl: this.embedUrl$,
    embedSnippet: this.embedSnippet$,
  }).pipe(
    map(({ state, shareUrl, embedUrl, embedSnippet }) => {
      return {
        ...state,
        shareUrl,
        embedUrl,
        embedSnippet,
      }
    })
  )

  protected copied: string = null
  public constructor(
    @Inject(DIALOG_DATA)
    private data: ShareOptions,
    private dialog: DialogRef,
    private web3: ShareService,
    private cdRef: ChangeDetectorRef,
    private preferences: AppPreferencesService
  ) {
    super({ active: false })
    if (data.ipnsKey) {
      this.patchState({
        ipnsEnabled: true,
        ipnsKey: data.ipnsKey,
        ipnsName: data.ipnsName,
      })
    }
    const web3token = preferences.web3token.get()
    if (web3token) {
      this.patchState({
        web3Token: web3token,
        web3Enabled: true,
      })
    }
  }

  protected async copy(value: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => value)
      .catch(() => null)
      .then((value) => {
        this.copied = value
        this.cdRef.markForCheck()
      })
  }

  protected close() {
    this.dialog.close()
  }

  protected prependHostname(path: string) {
    if (!path) {
      return null
    }
    if (environment.standalone) {
      return `https://www.nw-buddy.de` + path
    }
    return location.origin + path
  }

  protected buildShareUrl(cid: string, name: string) {
    if (cid || name) {
      const path = this.data.buildShareUrl?.(cid, name)
      return this.prependHostname(path)
    }
    return null
  }

  protected buildEmbedUrl(cid: string, name: string) {
    if (cid || name) {
      const path = this.data.buildEmbedUrl?.(cid, name)
      return this.prependHostname(path)
    }
    return null
  }

  protected share() {
    this.patchState({ active: true, error: false })
    this.web3
      .upload({
        content: this.data.content,
        enableIpns: this.get((state) => state.ipnsEnabled),
        ipnsKey: this.get((state) => state.ipnsKey),
        web3ApiToken: this.preferences.web3token.get(),
      })
      .then((it) => {
        this.data.published({
          cid: it.cid,
          ipnsKey: it.privateKey,
          ipnsName: it.name,
        })
        this.patchState({
          active: false,
          error: false,
          ipfsCid: it.cid,
          ipnsName: it.name,
          shared: true,
        })
      })
      .catch((err) => {
        console.error(err)
        this.patchState({
          active: false,
          error: true,
          ipfsCid: null,
          ipnsName: null,
          shared: true,
        })
      })
  }
}
