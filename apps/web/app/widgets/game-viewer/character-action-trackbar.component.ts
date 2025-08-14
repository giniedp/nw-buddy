import { Component, computed, inject } from '@angular/core'
import { rxResource } from '@angular/core/rxjs-interop'
import type { ProceduralBar, ProceduralLayer } from '@nw-viewer/babylon/adb'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { GameViewerService } from './game-viewer.service'
import { of } from 'rxjs'

@Component({
  selector: 'nwb-character-action-trackbar',
  template: `
    @if (fragment(); as fragment) {
      <div class="flex flex-col relative">
        @for (layer of fragment.procLayers; track $index; let layerFirst = $first, layerLast = $last) {
          <div class="flex flex-row overflow-visible">
            @for (bar of layer.sequence; track $index; let barFirst = $first, barLast = $last) {
              @let active = isActive(layer, bar, state()?.time);
              <div
                class="btn btn-xs border-none w-auto rounded-none bg-opacity-75 p-0 cursor-help outline-primary transition-all no-animation "
                [style.flex-basis.%]="bar.basis"
                [class.btn-info]="bar.type == 'Homing'"
                [class.btn-error]="!active && bar.type == 'CAGE-Damage'"
                [class.btn-secondary]="!active && bar.type == 'CAGE-CastSpell'"
                [class.btn-primary]="active"
                [class.btn-success]="
                  !!bar.type && bar.type != 'Homing' && bar.type != 'CAGE-Damage' && bar.type != 'CAGE-CastSpell'
                "
                [class.outline]="active"
                [class.outline-2]="active"
                [class.outline-0]="!active"
                [class.rounded-tl-md]="layerFirst && barFirst"
                [class.rounded-tr-md]="layerFirst && barLast"
                [class.rounded-bl-md]="layerLast && barFirst"
                [class.rounded-br-md]="layerLast && barLast"
                [class.z-10]="active"
                [tooltip]="bar.params ? tplTip : null"
              ></div>
              <ng-template #tplTip>
                <div class="px-3 pt-2">{{ bar.type }}</div>
                <nwb-property-grid [item]="bar.params" class="p-3 font-mono" />
              </ng-template>
            }
          </div>
        }
        <div
          class="absolute top-0 bottom-0 left-0 w-full border-l pointer-events-none"
          [class.opacity-0]="progress() <= 0 || progress() >= 1"
          [style.transform]="'translateX(' + progress() * 100 + '%)'"
        ></div>
      </div>
      @if (state(); as info) {
        <input
          type="range"
          min="0"
          [max]="info.duration * 1000"
          [value]="info.time * 1000"
          (input)="onProgressChange($event)"
          (dblclick)="onDblClick($event)"
          class="range range-xs w-full"
        />
      }
    }
  `,
  imports: [TooltipModule, PropertyGridModule],
  host: {
    class: 'block',
  },
})
export class CharacterActionTrackbarComponent {
  protected service = inject(GameViewerService)

  private player = this.service.adbPlayer

  protected fragment = rxResource({
    params: this.player,
    stream: ({ params }) => params?.fragment$ || of(null),
  }).value

  protected state = rxResource({
    params: this.player,
    stream: ({ params }) => params?.playbackState$ || of(null),
  }).value

  protected progress = computed(() => this.state()?.progress || 0)

  protected onProgressChange(event: Event) {
    const target = event.target as HTMLInputElement
    const value = parseFloat(target.value) / 1000
    this.player()?.goToTime(value)
  }

  protected onDblClick(event: Event) {
    this.player().executeFragment(this.player().fragment)
  }

  protected isActive(layer: ProceduralLayer, bar: ProceduralBar, time: number) {
    if (!bar?.type || !bar.type.startsWith('CAGE')) {
      return false
    }

    for (let i = 0; i < layer.sequence.length; i++) {
      const item = layer.sequence[i]
      time -= item.time
      if (time < 0) {
        return false
      }
      if (item !== bar) {
        continue
      }
      const next = layer.sequence[i + 1]
      if (!next) {
        return true
      }
      return time < next.time
    }
    return false
  }
}
