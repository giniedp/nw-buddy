import { A11yModule } from '@angular/cdk/a11y'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, HostListener, inject, Input, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EquipSlotId } from '@nw-data/common'
import { ItemClass } from '@nw-data/generated'
import { combineLatest, firstValueFrom, fromEvent, map, of, switchMap, takeUntil } from 'rxjs'
import { injectNwData, ItemInstance } from '~/data'
import { TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgAngleLeft } from '~/ui/icons/svg'
import { LayoutModule, ModalOpenOptions, ModalRef, ModalService } from '~/ui/layout'
import { imageFileFromPaste, imageFromDropEvent } from '~/utils/image-file-from-paste'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { GearImporterStore } from './gear-importer.store'
import { ItemRecognitionResult, recognizeItemFromImage } from './item-scanner'

export interface GearImporterDialogState {
  file: File
  loading: boolean
  slotId: EquipSlotId
}

@Component({
  selector: 'nwb-gear-importer-dialog',
  templateUrl: './gear-importer-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemDetailModule, IconsModule, FormsModule, A11yModule, LayoutModule],
  providers: [GearImporterStore],
  host: {
    class: 'flex flex-col h-full bg-base-100 rounded-md border border-base-100',
  },
})
export class GearImporterDialogComponent implements OnInit {
  public static open(modal: ModalService, options: ModalOpenOptions<GearImporterDialogComponent>) {
    options.content = GearImporterDialogComponent
    return modal.open<GearImporterDialogComponent, ItemInstance>(options)
  }

  @Input()
  public set slotId(value: EquipSlotId) {
    this.store.patchState({ slotId: value })
  }

  protected vm$ = combineLatest({
    result: this.store.result$,
    filteredResult: this.store.filteredResult$,
    selection: this.store.selection$,
    working: this.store.working$,
    filter: this.store.filter$,
    itemType: this.store.itemType$,
  }).pipe(
    map((data) => {
      const items = data.filteredResult || []
      return {
        items: items,
        itemCount: items.length,
        resultCount: data.result?.length,
        index: data.selection,
        item: items[data.selection],
        working: data.working,
        filter: data.filter,
      }
    }),
  )

  protected iconLeft = svgAngleLeft
  private db = injectNwData()
  private tl8 = inject(TranslateService)

  public constructor(
    private modalRef: ModalRef<ItemInstance>,
    private store: GearImporterStore,
  ) {
    //
  }

  protected submit(item: ItemInstance) {
    this.modalRef.close(item)
  }

  protected close() {
    this.modalRef.close(null)
  }

  protected back() {
    const state = this.store.state()
    if (!state.file) {
      return this.close()
    }
    this.store.patchState({
      file: null,
      results: null,
      selection: 0,
      filter: null,
    })
  }

  @HostListener('drop', ['$event'])
  protected onDrop(e: DragEvent) {
    e.preventDefault()
    this.store.patchState({
      file: imageFromDropEvent(e),
    })
  }

  @HostListener('dragover', ['$event'])
  protected onDragover(e: DragEvent) {
    e.preventDefault()
  }

  public ngOnInit(): void {
    fromEvent(document, 'paste')
      .pipe(takeUntil(this.store.destroy$))
      .subscribe((e: ClipboardEvent) => {
        this.store.patchState({
          file: imageFileFromPaste(e),
        })
      })

    combineLatest({
      image: this.store.imageFile$,
      itemClass: this.store.itemType$,
      items: this.db.itemsAll(),
      affixMap: this.db.affixStatsByIdMap(),
      perksMap: this.db.perksByIdMap(),
    })
      .pipe(
        switchMap(({ image, itemClass, items, affixMap, perksMap }) => {
          if (!image || !itemClass) {
            return of(null)
          }
          this.store.patchState({
            results: null,
            isScanning: true,
            hasError: false,
          })
          return recognizeItemFromImage({
            image,
            itemClass: [itemClass as ItemClass],
            items,
            affixMap,
            perksMap,
            tl8: (key) => this.tl8.get(key),
          }).catch((err) => {
            console.error(err)
            this.store.patchState({
              hasError: true,
            })
            return null as ItemRecognitionResult[]
          })
        }),
        takeUntil(this.store.destroy$),
      )
      .subscribe((results) => {
        this.store.patchState({
          results: results,
          selection: 0,
          isScanning: false,
        })
      })
  }

  protected async prevItem() {
    const state = await firstValueFrom(this.vm$)
    this.store.patchState({
      selection: Math.max(0, state.index - 1),
    })
  }
  protected async nextItem() {
    const state = await firstValueFrom(this.vm$)
    this.store.patchState({
      selection: Math.min(state.itemCount - 1, state.index + 1),
    })
  }

  protected updateFilter(value: string) {
    this.store.patchState({ filter: value, selection: 0 })
  }
}
