import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  TrackByFunction,
  Type,
} from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { BehaviorSubject, combineLatest, map, of, ReplaySubject, Subject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { getItemId } from '~/nw/utils'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDividerComponent } from '~/ui/item-frame/item-divider.component'
import { ItemDetailDescriptionComponent } from './item-detail-description.component'
import { ItemDetailHeaderComponent } from './item-detail-header.component'
import { ItemDetailInfoComponent } from './item-detail-info.component'
import { ItemDetailPerksComponent } from './item-detail-perks.component'
import { ItemDetailStatsComponent } from './item-detail-stats.component'
import { ItemDetailService } from './item-detail.service'

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
      provide: ItemDetailService,
      useExisting: forwardRef(() => ItemCardComponent),
    },
  ],
})
export class ItemCardComponent extends ItemDetailService {
  @Input()
  public set entityId(value: string) {
    this.entityId$.next(value)
  }

  @Input()
  public set entity(value: ItemDefinitionMaster | Housingitems) {
    this.entityId$.next(getItemId(value))
  }

  @Input()
  public set gsOverride(value: number) {
    this.gsOverride$.next(value)
  }
  @Input()
  public set gsEditable(value: boolean) {
    this.gsEditable$.next(value)
  }
  @Output()
  public gsEdit = this.gsEdit$

  @Input()
  public set perkOverride(value: Record<string, string>) {
    this.perkOverride$.next(value)
  }
  @Input()
  public set perkEditable(value: boolean) {
    this.perkEditable$.next(value)
  }
  @Output()
  public perkEdit = this.perkEdit$

  @Input()
  public enableTracker: boolean

  @Input()
  public enableInfoLink: boolean

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

  protected disableInfo$ = new BehaviorSubject(false)
  protected disableStats$ = new BehaviorSubject(false)
  protected disablePerks$ = new BehaviorSubject(false)
  protected disableDescription$ = new BehaviorSubject(false)

  protected components$ = combineLatest({
    vmDescription: this.disableDescription$.pipe(switchMap((it) => (it ? of(null) : this.vmDescription$))),
    vmStats: this.disableStats$.pipe(switchMap((it) => (it ? of(null) : this.vmStats$))),
    vmInfo: this.disableInfo$.pipe(switchMap((it) => (it ? of(null) : this.vmInfo$))),
    vmPerks: this.disablePerks$.pipe(switchMap((it) => (it ? of(null) : this.vmPerks$))),
  }).pipe(
    map(({ vmDescription, vmStats, vmInfo, vmPerks }) => {
      let list: Array<Type<any>> = []
      if (vmDescription?.runeImage) {
        appendSection(list, ItemDetailDescriptionComponent)
      }
      if (vmStats && (vmStats.gsLabel || vmStats.stats?.length)) {
        appendSection(list, ItemDetailStatsComponent)
      }
      if (vmPerks?.length) {
        appendSection(list, ItemDetailPerksComponent)
      }
      if (vmDescription && !vmDescription.runeImage && !!vmDescription.description) {
        appendSection(list, ItemDetailDescriptionComponent)
      }
      if (vmInfo) {
        appendSection(list, ItemDetailInfoComponent)
      }
      return list
    })
  )

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(db: NwDbService, cdRef: ChangeDetectorRef) {
    super(db, cdRef)
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
