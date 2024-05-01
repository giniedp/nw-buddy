import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject, input, viewChild } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import saveAs from 'file-saver'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { GatherableDetailMapComponent } from './gatherable-detail-map.component'
import { GatherableDetailStore } from './gatherable-detail.store'
import { GatherableDetailStore2 } from './gatherable-detail.store2'
import { patchState } from '@ngrx/signals'

@Component({
  standalone: true,
  selector: 'nwb-gatherable-detail',
  templateUrl: './gatherable-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, GatherableDetailMapComponent, IconsModule, TooltipModule],
  providers: [DecimalPipe, GatherableDetailStore, GatherableDetailStore2],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class GatherableDetailComponent {
 protected store = inject(GatherableDetailStore)
  protected store2 = inject(GatherableDetailStore2)
  protected map = viewChild(GatherableDetailMapComponent)

  public showMap = input(false)
  public showProps = input(false)

  @Input()
  public set gatherableId(value: string) {
    patchState(this.store2, { gatherableId: value })
    this.store.patchState({ recordId: value })
  }

  public get recordId() {
    return this.store2.gatherableId()
  }

  public get icon() {
    return this.store2.icon()
  }
  public get name() {
    return this.store2.name()
  }
  public get size() {
    return this.store2.size()
  }
  public get tradeSkill() {
    return this.store2.tradeSkill()
  }
  public get sizeSiblings() {
    return this.store2.sizeSiblings()
  }
  public get variations() {
    return this.store2.variations()
  }
  public get lootTable() {
    return this.store2.lootTable()
  }
  public get lootTables() {
    return this.store2.lootTables()
  }
  public get gatherableIds() {
    return this.store2.idsForMap()
  }

  protected iconDownload = svgDownload

  protected downloadPositions() {

    // const data = this.map().spawns()
    // const fileName = `${this.gatherableId}.json`
    // const object = {
    //   gatherableID: this.gatherableId,
    //   points: data.points,
    // }
    // const blob = new Blob([JSON.stringify(object, null, 2)], {
    //   type: 'application/json',
    // })
    // saveBlobToFile(blob, fileName)
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
