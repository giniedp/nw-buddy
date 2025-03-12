import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { ToastController } from '@ionic/angular/standalone'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { PreferencesService } from '~/preferences'
import { LayoutModule } from '~/ui/layout'
import { observeRouteParam, queryParamModel } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { LootContextEditorComponent, LootModule } from '~/widgets/loot'

@Component({
  selector: 'nwb-loot-detail-page',
  templateUrl: './loot-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, RouterModule, LootModule, FormsModule, LayoutModule],
  host: {
    class: 'block',
  },
})
export class LootDetailPageComponent implements OnInit {
  private db = injectNwData()
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private toast = inject(ToastController)
  private dref = inject(DestroyRef)
  private preferences = inject(PreferencesService)
  private platform = inject(PlatformService)

  private hideLockedParam = queryParamModel('hideLocked')

  protected id$ = observeRouteParam(this.route, 'id')
  protected parents$ = this.id$.pipe(
    switchMap((id) => this.db.lootTablesByLootTableId(id)),
    map((it) => (it ? Array.from(it.values()) : null)),
  )
  protected parents = toSignal(this.parents$, { initialValue: [] })

  protected get showLocked() {
    return this.hideLockedParam.value() !== 'true'
  }
  protected set showLocked(value: boolean) {
    this.hideLockedParam.update(value ? null : 'true')
  }

  @ViewChild(LootContextEditorComponent, { static: true })
  protected editor: LootContextEditorComponent

  private initialState: any = null
  private encodedState: string = null

  public constructor() {
    const queryState = decodeState(this.route.snapshot.queryParamMap.get('lootContext'))
    const sessionState = this.preferences.session.get('loot-table-context')
    this.initialState = queryState || sessionState || null
    if (queryState) {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: { lootContext: null },
        replaceUrl: true,
      })
    }
  }

  public ngOnInit() {
    if (this.initialState) {
      this.editor.restoreState(this.initialState)
    }
    this.editor.stateChange.pipe(takeUntilDestroyed(this.dref)).subscribe((data) => {
      this.handleStateChange(data)
    })
  }
  protected handleStateChange(value: any) {
    this.preferences.session.set('loot-table-context', value)
    this.encodedState = encodeState(value)
  }
  protected copyLink() {
    const url = new URL(this.router.url, this.platform.websiteUrl)
    url.searchParams.set('lootContext', this.encodedState)
    navigator.clipboard.writeText(url.toString())
    this.toast
      .create({
        message: 'Link was copied to clipboard',
        duration: 2000,
        position: 'top',
      })
      .then((toast) => toast.present())
  }
}

function decodeState(state: string) {
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
