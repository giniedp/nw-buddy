import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ComponentStore } from '@ngrx/component-store'
import { Gamemodes, Vitals } from '@nw-data/generated'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { selectStream } from '~/utils'
import { ItemModelInfo, ModelViewerModule, ModelViewerService } from '../model-viewer'
import { VitalDamageTableComponent } from './vital-damage-table.component'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailInfosComponent } from './vital-detail-infos.component'
import { VitalDetailWeaknessComponent } from './vital-detail-weakness.component'
import { VitalDetailStore } from './vital-detail.store'

export type VitalSection = 'weakness' | 'damage' | 'model'
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
    ModelViewerModule,
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'block  rounded-md overflow-clip',
    '[class.bg-black]': '!isTransparent$()',
    '[class.bg-white/10]': 'isTransparent$()',
    '[class.backdrop-blur-sm]': 'isTransparent$()',
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

      <nwb-model-viewer [models]="vm.models" *ngIf="vm.isSectionModel" class="aspect-square"></nwb-model-viewer>
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
  protected tabs$ = this.select(this.sectionsEnabled$, this.store.hasDamageTable$, this.store.modelFiles$, selectTabs)

  protected vm$ = selectStream(
    {
      id: this.store.vitalId$,
      vital: this.store.vital$,
      level: this.store.level$,

      tabs: this.tabs$,
      models: this.store.modelFiles$,
      selectedTab: this.select(({ section }) => section),
    },
    (data) => {
      if (data.selectedTab === 'model' && !data.models?.length) {
        data.selectedTab = 'weakness'
      }
      return {
        ...data,
        isSectionWeakness: data.selectedTab === 'weakness',
        isSectionDamage: data.selectedTab === 'damage',
        isSectionModel: data.selectedTab === 'model',
      }
    }
  )

  protected isTransparent$ = toSignal(this.vm$.pipe(map((it) => !it.isSectionModel)))

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

function selectTabs(sectionsEnabled: boolean, hasDamageTable: boolean, modelFiles: ItemModelInfo[]) {
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
  if (modelFiles?.length > 0) {
    tabs.push({
      id: 'model',
      label: '3D Model',
    })
  }
  return tabs
}
