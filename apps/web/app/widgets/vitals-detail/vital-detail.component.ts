import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { Gamemodes, Vitals } from '@nw-data/generated'
import { combineLatest } from 'rxjs'
import { NwModule } from '~/nw'
import { DestroyService } from '~/utils'
import { ModelViewerService } from '../model-viewer'
import { VitalDamageTableComponent } from './vital-damage-table.component'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailInfosComponent } from './vital-detail-infos.component'
import { VitalDetailWeaknessComponent } from './vital-detail-weakness.component'
import { VitalDetailStore } from './vital-detail.store'

export type VitalSection = 'weakness' | 'damage'
export interface VitalTab {
  id: VitalSection
  label: string
}
@Component({
  standalone: true,
  selector: 'nwb-vital-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    VitalDetailWeaknessComponent,
    VitalDetailHeaderComponent,
    VitalDetailInfosComponent,
    VitalDamageTableComponent,
  ],
  providers: [DestroyService, VitalDetailStore],
  host: {
    class: 'block backdrop-blur-sm bg-white/10 rounded-md overflow-clip',
  },
  template: `
    <ng-container *ngIf="vm$ | async; let vm">
      <nwb-vital-detail-header [vital]="vm.vital"></nwb-vital-detail-header>
      <div class="tabs rounded-none justify-center bg-base-300" *ngIf="vm.tabs?.length > 1">
        <ng-container *ngFor="let tab of vm.tabs">
          <a
            class="tab tab-bordered tab-sm"
            [class.tab-active]="tab.id === vm.selectedTab"
            (click)="openSection(tab.id)"
          >
            {{ tab.label }}
          </a>
        </ng-container>
      </div>

      <nwb-vital-detail-weakness
        *ngIf="vm.isSectionWeakness"
        [vital]="vm.vital"
        class="w-full bg-transparent"
      ></nwb-vital-detail-weakness>

      <nwb-vital-damage-table [vitalId]="vm.id" *ngIf="vm.isSectionDamage"></nwb-vital-damage-table>
    </ng-container>
  `,
})
export class VitalDetailComponent extends ComponentStore<{
  enableSections: boolean
  enableViewer: boolean
  section: VitalSection
}> {
  @Input()
  public set vital(value: Partial<Vitals>) {
    this.store.patchState({ vitalId: value.VitalsID })
  }

  @Input()
  public set vitalId(value: string) {
    this.store.patchState({ vitalId: value })
  }

  @Input()
  public set enableSections(value: boolean) {
    this.patchState({ enableSections: value })
  }

  @Input()
  public isGroup: boolean

  @Input()
  public dungeons: Gamemodes[]

  protected sectionsEnabled$ = this.select(({ enableSections }) => enableSections)
  protected tabs$ = this.select(this.sectionsEnabled$, this.store.hasDamageTable$, selectTabs)

  protected vm$ = combineLatest({
    id: this.store.vitalId$,
    vital: this.store.vital$,
    level: this.store.level$,
    isSectionWeakness: this.select(({ section }) => section === 'weakness'),
    isSectionDamage: this.select(({ section }) => section === 'damage'),
    tabs: this.tabs$,
    selectedTab: this.select(({ section }) => section),
  })

  public constructor(private store: VitalDetailStore, private viewerService: ModelViewerService) {
    super({
      enableSections: false,
      enableViewer: false,
      section: 'weakness',
    })
  }

  protected openSection(section: VitalSection) {
    this.patchState({
      section: section,
    })
  }
}

function selectTabs(sectionsEnabled: boolean, hasDamageTable: boolean) {
  const tabs: VitalTab[] = []
  if (!sectionsEnabled) {
    return tabs
  }
  tabs.push({
    id: 'weakness',
    label: 'Weakness',
  })
  if (hasDamageTable) {
    tabs.push({
      id: 'damage',
      label: 'Damage',
    })
  }
  return tabs
}
