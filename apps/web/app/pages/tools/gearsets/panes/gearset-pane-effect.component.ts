import { DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { combineLatest, take, tap } from 'rxjs'

import { NwDbService, NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, getStatusEffectTownBuffIds } from '@nw-data/common'
import { GearsetSlotStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgLink16p, svgLinkSlash16p, svgPlus, svgRotate, svgTrashCan } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { shareReplayRefCount } from '~/utils'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { InventoryPickerService } from '../../inventory/inventory-picker.service'

export interface EffectSlotState {
  effectId: string
  count: number
  max: number
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-effect',
  templateUrl: './gearset-pane-effect.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    ItemDetailModule,
    StatusEffectDetailModule,
    IconsModule,
    LayoutModule,
    TooltipModule,
    ItemFrameModule,
  ],
  providers: [GearsetSlotStore],
  host: {
    class: 'block bg-black rounded-md flex flex-col overflow-hidden',
  },
})
export class GearsetPaneEffectComponent extends ComponentStore<EffectSlotState> {
  @Input()
  public set effectId(value: string) {
    this.patchState({ effectId: value })
  }

  @Input()
  public set count(value: number) {
    this.patchState({ count: value })
  }

  @Input()
  public set max(value: number) {
    this.patchState({ max: value })
  }

  @Input()
  public disabled: boolean

  @Output()
  public effectChange = new EventEmitter<Array<{ id: string; stack: number }>>()

  protected readonly effectId$ = this.select(({ effectId }) => effectId)
  protected readonly effect$ = this.select(this.db.statusEffectsMap, this.effectId$, (effects, effectId) =>
    effects.get(effectId)
  )
  protected readonly icon$ = this.select(this.effect$, (effect) => effect?.PlaceholderIcon || NW_FALLBACK_ICON)
  protected readonly count$ = this.select(({ count }) => count)
  protected readonly max$ = this.select(({ max }) => max)

  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconPlus = svgPlus
  protected iconChange = svgRotate
  protected iconMenu = svgEllipsisVertical

  protected vm$ = combineLatest({
    effectId: this.effectId$,
    effect: this.effect$,
    count: this.count$,
    max: this.max$,
    icon: this.icon$,
  })
    .pipe(
      tap((it) => {
        this.updateClass('screenshot-hidden', !it.effect)
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private picker: InventoryPickerService,
    private renderer: Renderer2,
    private elRef: ElementRef<HTMLElement>
  ) {
    super({
      count: 0,
      effectId: null,
      max: 1,
    })
  }

  public ngOnInit(): void {}

  protected async pickItem() {
    const effectId = this.get(({ effectId }) => effectId)
    const buffIds = getStatusEffectTownBuffIds()
    this.picker
      .pickEffect({
        title: 'Select Status Effect',
        selection: effectId ? [effectId] : [],
        multiple: false,
        predicate: (item) => buffIds.includes(item.StatusID),
      })
      .pipe(take(1))
      .subscribe(([item]) => {
        this.effectChange.emit([
          {
            id: effectId,
            stack: 0,
          },
          {
            id: item.StatusID,
            stack: 1,
          },
        ])
      })
  }

  protected removeItem() {
    this.effectChange.emit([
      {
        id: this.get(({ effectId }) => effectId),
        stack: 0,
      },
    ])
  }

  private updateClass(name: string, hasClass: boolean) {
    if (hasClass) {
      this.renderer.addClass(this.elRef.nativeElement, name)
    } else {
      this.renderer.removeClass(this.elRef.nativeElement, name)
    }
  }
}
