import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject, viewChild } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import saveAs from 'file-saver'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { GatherableDetailMapComponent } from './gatherable-detail-map.component'
import { GatherableDetailStore } from './gatherable-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail',
  templateUrl: './gatherable-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, GatherableDetailMapComponent, IconsModule, TooltipModule],
  providers: [DecimalPipe, GatherableDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class GatherableDetailComponent {
  protected store = inject(GatherableDetailStore)
  protected map = viewChild(GatherableDetailMapComponent)

  @Input()
  public set gatherableId(value: string) {
    this.store.patchState({ recordId: value })
  }

  public readonly recordId = toSignal(this.store.gatherableId$)
  public readonly icon = toSignal(this.store.icon$)
  public readonly name = toSignal(this.store.name$)
  public readonly size = toSignal(this.store.size$)
  public readonly tradeSkill = toSignal(this.store.tradeSkill$)
  public readonly lootTableIds = toSignal(this.store.lootTableIds$)
  public readonly props = toSignal(this.store.props$)
  public readonly siblings = toSignal(this.store.siblings$)

  protected iconDownload = svgDownload

  protected downloadPositions() {
    const data = this.map().spawns()
    const fileName = `${data.gatherableID}.json`
    const object = {
      gatherableID: data.gatherableID,
      points: data.points,
    }
    const blob = new Blob([JSON.stringify(object, null, 2)], {
      type: 'application/json',
    })
    saveBlobToFile(blob, fileName)
  }
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
