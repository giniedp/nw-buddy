import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Output
} from '@angular/core'
import { RouterModule } from '@angular/router'
import { BehaviorSubject, combineLatest, defer, firstValueFrom, map } from 'rxjs'
import { GearsetRecord, GearsetSlotStore, ItemInstanceRecord, ItemInstanceRow } from '~/data'
import { NwModule } from '~/nw'
import { EquipSlot, getItemRarityLabel, getItemTierAsRoman, getItemTypeName } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical, svgLink16p, svgLinkSlash16p, svgTrashCan } from '~/ui/icons/svg'
import { humanize } from '~/utils'
import { DnDService } from '~/utils/dnd.service'
import { ItemDetailModule } from '~/widgets/item-detail'


@Component({
  standalone: true,
  selector: 'nwb-gearset-form-cell',
  templateUrl: './gearset-form-cell.component.html',
  styleUrls: ['./gearset-form-cell.component.scss'],
  imports: [CommonModule, RouterModule, NwModule, IconsModule, CdkMenuModule, ItemDetailModule],
  providers: [GearsetSlotStore],
  host: {
    class: 'flex aspect-square rounded-md border bg-base-100 relative 4xl:aspect-auto flex-row',
  },
})
export class GearsetFormCellComponent implements OnInit {
  @Input()
  public set slot(value: EquipSlot) {
    this.slot$.next(value)
  }
  public get slot() {
    return this.slot$.value
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    this.gearset$.next(value)
  }
  public get gearset() {
    return this.gearset$.value
  }

  @Input()
  public showControls: boolean

  protected dragState: 'idle' | 'success' | 'error' = 'idle'
  protected slot$ = new BehaviorSubject<EquipSlot>(null)
  protected gearset$ = new BehaviorSubject<GearsetRecord>(null)
  protected vm$ = defer(() =>
    combineLatest({
      item: this.cellStore.item$,
      name: this.cellStore.itemName$,
      typeName: this.cellStore.typeName$,
      isNamed: this.cellStore.isNamed$,
      gearScore: this.cellStore.instance$.pipe(map((it) => it?.gearScore)),
      rarity: this.cellStore.rarity$,
      rarityName: this.cellStore.rarity$.pipe(map(getItemRarityLabel)),
      sourceLabel: this.cellStore.item$.pipe(map((it) => humanize(it?.['$source']))),
      tierLabel: this.cellStore.tierLabel$,
      slot: this.cellStore.slot$,

      canRemove: this.cellStore.canRemove$,
      canBreak: this.cellStore.canBreak$,
    })
  )
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconMenu = svgEllipsisVertical

  @HostBinding('class.border-neutral')
  protected get borderNeutral() {
    return this.dragState === 'idle'
  }

  @HostBinding('class.border-success')
  protected get borderSuccess() {
    return this.dragState === 'success'
  }

  @HostBinding('class.border-error')
  protected get borderError() {
    return this.dragState === 'error'
  }

  @Output()
  public itemRemove = new EventEmitter<void>()

  @Output()
  public itemUnlink = new EventEmitter<ItemInstanceRecord>()

  @Output()
  public itemDropped = new EventEmitter<ItemInstanceRecord>()

  public constructor(
    private cellStore: GearsetSlotStore,
    private dnd: DnDService,
    private cdRef: ChangeDetectorRef
  ) {
    //
  }

  public ngOnInit(): void {
    this.cellStore.useSlot(
      combineLatest({
        gearset: this.gearset$,
        slot: this.slot$,
      })
    )
  }

  protected getLink() {
    const slot = this.gearset.slots?.[this.slot.id]
    if (!slot) {
      return []
    }
    if (typeof slot === 'string') {
      return [slot]
    }
    return [this.gearset.id, this.slot.id]
  }

  @HostListener('dragenter', ['$event'])
  protected onDragEnter() {
    const data = this.dnd.data
    if (this.isApplicable(data)) {
      this.dragState = 'success'
      this.cdRef.markForCheck()
    } else {
      this.dragState = 'error'
      this.cdRef.markForCheck()
    }
  }

  @HostListener('dragleave', ['$event'])
  protected onDragLeave() {
    this.dragState = 'idle'
    this.cdRef.markForCheck()
  }

  @HostListener('dragover', ['$event'])
  protected onDragOver(event: DragEvent) {
    const data = this.dnd.data as ItemInstanceRow
    if (this.isApplicable(data)) {
      event.dataTransfer.dropEffect = 'link'
      this.dragState = 'success'
    } else {
      event.dataTransfer.dropEffect = 'none'
      this.dragState = 'error'
    }
    this.cdRef.markForCheck()
    event.preventDefault()
  }

  @HostListener('drop', ['$event'])
  protected onDrop(event: DragEvent) {
    this.dragState = 'idle'
    this.cdRef.markForCheck()
    const data = this.dnd.data as ItemInstanceRow
    if (this.isApplicable(data)) {
      this.itemDropped.emit(data.record)
    }
  }

  private isApplicable(data: ItemInstanceRow) {
    if (!data || !data.item || !data.item.ItemClass || !data.record?.id) {
      return false
    }
    return data.item.ItemClass.some((it) => it === this.slot$.value.itemType)
  }

  protected async breakLink() {
    const instance = (await firstValueFrom(this.cellStore.instance$)) as ItemInstanceRecord
    if (instance.id) {
      this.itemUnlink.next(instance)
    }
  }

  protected remove() {
    this.itemRemove.next()
  }
}
