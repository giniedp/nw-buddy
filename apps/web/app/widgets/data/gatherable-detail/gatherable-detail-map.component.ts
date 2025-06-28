import { OverlayModule } from '@angular/cdk/overlay'
import { DecimalPipe } from '@angular/common'
import { Component, computed, effect, inject, input, untracked, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { getGatherableNodeSizes } from '@nw-data/common'
import saveAs from 'file-saver'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDice, svgExpand, svgFire } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { GameMapComponent, GameMapCoordsComponent, GameMapLayerDirective } from '~/widgets/game-map'
import { GatherableDetailMapStore } from './gatherable-detail-map.store'

@Component({
  selector: 'nwb-gatherable-detail-map',
  templateUrl: './gatherable-detail-map.component.html',
  imports: [
    NwModule,
    TooltipModule,
    FormsModule,
    OverlayModule,
    LayoutModule,
    IconsModule,
    GameMapComponent,
    GameMapLayerDirective,
    GameMapCoordsComponent,
  ],
  providers: [DecimalPipe, GatherableDetailMapStore],
  host: {
    class: 'block relative',
    '[class.hidden]': '!isVisible',
  },
})
export class GatherableDetailMapComponent {
  protected store = inject(GatherableDetailMapStore)
  protected iconExpand = svgExpand
  protected iconFire = svgFire
  protected iconDice = svgDice

  protected mapComponent = viewChild(GameMapComponent)
  protected get isVisible() {
    return !!this.store.mapId()
  }
  protected nodeSizes = getGatherableNodeSizes()

  public tag = input<string>()
  public gatherableIds = input<string[]>()
  public constructor() {
    effect(() => {
      const ids = this.gatherableIds()
      untracked(() => this.store.load({ ids }))
    })
  }

  public mapData = computed(() => {
    const data = this.store.data()
    const mapIds = Object.keys(data || {})
    const mapId = mapIds[0]
    return data?.[mapId]?.data
  })
}

async function saveBlobToFile(blob: Blob, filename: string) {
  const showSaveFilePicker = window['showSaveFilePicker'] as any
  if (!showSaveFilePicker) {
    return saveAs(blob, filename)
  }

  const handle = await showSaveFilePicker({
    suggestedName: filename,
  })
  if (await verifyPermission(handle)) {
    await writeFile(handle, blob)
  }
}

async function writeFile(fileHandle, contents: Blob) {
  const writable = await fileHandle.createWritable()
  await writable.write(contents)
  await writable.close()
}

async function verifyPermission(fileHandle) {
  const options = {
    mode: 'readwrite',
  }
  // Check if permission was already granted. If so, return true.
  if ((await fileHandle.queryPermission(options)) === 'granted') {
    return true
  }
  // Request permission. If the user grants permission, return true.
  if ((await fileHandle.requestPermission(options)) === 'granted') {
    return true
  }
  // The user didn't grant permission, so return false.
  return false
}
