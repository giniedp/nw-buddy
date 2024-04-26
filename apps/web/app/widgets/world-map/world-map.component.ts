import { CommonModule } from '@angular/common'
import { Component, ElementRef, inject, input, output, signal } from '@angular/core'
import { IconsModule } from '~/ui/icons'
import { svgExpand } from '~/ui/icons/svg'
import { Landmark, MapView, MapViewBounds } from '../land-map'
import { MarkerEventData } from './create-map'
import { WorldMapDirective } from './world-map.directive'
import { sortBy } from 'lodash'

@Component({
  standalone: true,
  selector: 'nwb-world-map',
  template: `
    <div
      [nwbWorldMap]
      [map]="map()"
      [landmarks]="landmarks()"
      [fit]="fit()"
      [view]="view()"
      [bounds]="bounds()"
      (markerHovered)="onMarkerHover($event)"
      (markerClicked)="onMarkerClick($event)"
      class="w-full h-full"
    ></div>
    <div class="w-auto flex flex-col absolute top-2 left-2 pointer-events-none text-sm text-shadow-sm shadow-black">
      @if (showCoords() && coordsAtCursor()?.length) {
        <div class="font-mono">
          @for (it of coordsAtCursor(); track $index) {
            {{ it | number: '0.2-2' }}
          }
        </div>
      }
    </div>

    @if (showTooltip() && cursorPosition() && markersAtCursor()?.length) {
      <div
        class="absolute bg-base-300 bg-opacity-85 px-2 py-1 border border-base-100 rounded-sm prose prose-sm"
        [style.top.px]="cursorPosition().y + 5"
        [style.left.px]="cursorPosition().x + 5"
      >
        @for (marker of markersAtCursor(); track $index) {
          @if (marker) {
            <div [innerHTML]="marker.title"></div>
          }
        }
      </div>
    }
    <ng-content />
  `,
  imports: [CommonModule, WorldMapDirective, IconsModule],
  host: {
    class: 'block bg-[#859594] relative',
  },
})
export class WorldMapComponent {
  public map = input<string>('newworld_vitaeeterna')
  public landmarks = input<Landmark[]>(null)
  public fit = input(false)
  public view = input<MapView>(null)
  public bounds = input<MapViewBounds>(null)

  public showCoords = input<boolean>(null)
  public showTooltip = input<boolean>(null)

  public featureClicked = output<string>()
  public pointClicked = output<number[]>()

  public coordsAtCursor = signal<number[]>([])
  public markersAtCursor = signal<Landmark[]>([])
  public cursorPosition = signal<{ x: number; y: number }>(null)

  protected iconExpand = svgExpand
  private elRef = inject(ElementRef<HTMLElement>)

  public toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      this.elRef.nativeElement.requestFullscreen()
    }
  }

  protected onMarkerHover(marker: MarkerEventData) {
    this.coordsAtCursor.set(marker?.coords || [])
    this.markersAtCursor.set(marker?.markers || [])
    if (marker) {
      this.cursorPosition.set({ x: marker?.pixel[0], y: marker?.pixel[1] })
    } else {
      this.cursorPosition.set(null)
    }
  }

  protected onMarkerClick(marker: MarkerEventData) {

    if (marker) {
      this.pointClicked.emit(marker.coords)
      this.featureClicked.emit(sortBy(marker.markers, (it) => it.id)?.[0]?.id)
    }
  }
}
