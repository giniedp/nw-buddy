import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input, Output, Type } from '@angular/core'
import { AttributeRef, getItemId, getWeaponTagFromWeapon } from '@nw-data/common'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/generated'
import { BehaviorSubject, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDividerComponent } from '~/ui/item-frame/item-divider.component'
import { ModelViewerService } from '../../model-viewer/model-viewer.service'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailGsDamage } from './item-detail-gs-damage.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-item-card',
  templateUrl: './item-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ItemDetailDescriptionComponent,
    ItemDetailHeaderComponent,
    ItemDetailInfoComponent,
    ItemDetailPerksComponent,
    ItemDetailStatsComponent,
    ItemFrameModule,
  ],
  exportAs: 'card',
  host: {
    class: 'block bg-black rounded-md overflow-clip font-nimbus',
  },
  providers: [
    {
      provide: ItemDetailStore,
      useExisting: forwardRef(() => ItemCardComponent),
    },
  ],
})
export class ItemCardComponent extends ItemDetailStore {
  @Input()
  public set entityId(value: string) {
    this.patchState({ entityId: value })
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.patchState({ entityId: getItemId(value) })
  }

  @Input()
  public set playerLevel(value: number) {
    this.patchState({ playerLevel: value })
  }

  @Input()
  public set attrValueSums(value: Record<AttributeRef, number>) {
    this.patchState({ attrValueSums: value })
  }

  @Input()
  public set gsOverride(value: number) {
    this.patchState({ gsOverride: value })
  }
  @Input()
  public set gsEditable(value: boolean) {
    this.patchState({ gsEditable: value })
  }
  @Output()
  public gsEdit = this.gsEdit$

  @Output()
  public itemChange = this.item$

  @Output()
  public entityChange = this.entity$

  @Output()
  public housingItemChange = this.housingItem$

  @Input()
  public set perkOverride(value: Record<string, string>) {
    this.patchState({ perkOverride: value })
  }
  @Input()
  public set perkEditable(value: boolean) {
    this.patchState({ perkEditable: value })
  }
  @Output()
  public perkEdit = this.perkEdit$

  @Input()
  public enableTracker: boolean

  @Input()
  public enableInfoLink: boolean

  @Input()
  public enableLink: boolean

  @Input()
  public set disableStats(value: boolean) {
    this.disableStats$.next(value)
  }

  @Input()
  public set disableInfo(value: boolean) {
    this.disableInfo$.next(value)
  }

  @Input()
  public set disableDescription(value: boolean) {
    this.disableDescription$.next(value)
  }

  @Input()
  public set disablePerks(value: boolean) {
    this.disablePerks$.next(value)
  }

  @Input()
  public square: boolean

  protected disableInfo$ = new BehaviorSubject(false)
  protected disableStats$ = new BehaviorSubject(false)
  protected disablePerks$ = new BehaviorSubject(false)
  protected disableDescription$ = new BehaviorSubject(false)

  protected components$ = combineLatest({
    vmDescription: this.disableDescription$.pipe(switchMap((it) => (it ? of(null) : this.description$))),
    vmStats: this.disableStats$.pipe(switchMap((it) => (it ? of(null) : this.vmStats$))),
    vmInfo: this.disableInfo$.pipe(switchMap((it) => (it ? of(null) : this.vmInfo$))),
    vmPerks: this.disablePerks$.pipe(switchMap((it) => (it ? of(null) : this.vmPerks$))),
    vmWeapon: this.weaponStats$,
  }).pipe(
    map(({ vmDescription, vmStats, vmInfo, vmPerks, vmWeapon }) => {
      let list: Array<Type<any>> = []
      if (vmDescription?.image) {
        appendSection(list, ItemDetailDescriptionComponent)
      }
      if (vmStats && (vmStats.gsLabel || vmStats.stats?.length)) {
        appendSection(list, ItemDetailStatsComponent)
        if (vmWeapon && getWeaponTagFromWeapon(vmWeapon)) {
          appendSection(list, ItemDetailGsDamage)
        }
      }
      if (vmPerks?.length) {
        appendSection(list, ItemDetailPerksComponent)
      }
      if (!vmDescription?.image && !!vmDescription?.description) {
        appendSection(list, ItemDetailDescriptionComponent)
      }
      if (vmInfo) {
        appendSection(list, ItemDetailInfoComponent)
      }
      return list
    })
  )

  protected trackByIndex = (i: number) => i

  public constructor(db: NwDbService, ms: ModelViewerService, cdRef: ChangeDetectorRef) {
    super(db, ms, cdRef)
  }
}

function appendSection(list: Array<Type<any>>, component: Type<any>) {
  if (!list) {
    list = []
  }
  if (list.length) {
    list.push(ItemDividerComponent)
  }
  list.push(component)
}
