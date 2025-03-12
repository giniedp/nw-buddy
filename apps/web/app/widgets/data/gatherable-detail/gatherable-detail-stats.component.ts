import { Component, inject } from '@angular/core'
import { GatherableDetailStore } from './gatherable-detail.store'
import { NwModule } from '~/nw'

@Component({
  selector: 'nwb-gatherable-detail-stats',
  template: `
    @if (store.restriction(); as text) {
      <div class="flex flex-row gap-1">
        <span class="opacity-50">{{ text | nwHumanize }} </span>
      </div>
    }
    @if (store.requiredSkillLevel(); as level) {
      <div class="flex flex-row gap-1">
        <span class="opacity-50">Required skill level: </span>
        <span>{{ level }} {{ store.tradeSkill() }}</span>
      </div>
    }
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Gather time: </span>
      <span>{{ store.baseGatherTime() }}</span>
    </div>
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Min respawn rate: </span>
      <span>{{ store.minRespawnRate() }}</span>
    </div>
    <div class="flex flex-row gap-1">
      <span class="opacity-50">Max respawn rate: </span>
      <span>{{ store.maxRespawnRate() }}</span>
    </div>

    <ng-content />
    <!--
      @if (props() || map?.spawns()?.points?.length) {
        <div class="p-3">
          @for(prop of props(); track $index){
            <div class="flex flex-row gap-1">
              <span class="opacity-50">{{ prop.label }}: </span>
              <span>{{ prop.value }}</span>
            </div>
          }

          @if (map?.spawns()?.points?.length) {
            <div class="flex flex-row gap-1">
              <span class="opacity-50">Spawns: </span>
              <span [tooltip]="'Download spawn positions'" class="cursor-pointer" (click)="downloadPositions()">{{ map.spawns().points.length }} <nwb-icon [icon]="iconDownload" class="w-4 h-4"/></span>
            </div>
          }
        </div>
      }
      <ng-content></ng-content> -->
  `,
  host: {
    class: 'flex flex-col',
  },
  imports: [NwModule],
})
export class GatherableDetailStatsComponent {
  public readonly store = inject(GatherableDetailStore)
}
