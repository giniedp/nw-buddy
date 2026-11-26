import { ChangeDetectionStrategy, Component, computed, inject, Injector, input } from '@angular/core'
import { EquipSlot, getEquipSlotForId, NW_FALLBACK_ICON } from '@nw-data/common'
import { DyeColorData } from '@nw-data/generated'
import { filter, map } from 'rxjs'
import { injectNwData } from '~/data'
import type { TransmogSlotId } from '~/data/transmogs'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgEye, svgEyeSlash, svgPause, svgPlay } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { ModalService } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { EmoteTableAdapter } from '~/widgets/data/emote-table'
import { getTransmogCategory } from '~/widgets/data/transmog'
import { provideTransmogCellOptions, TransmogTableAdapter } from '~/widgets/data/transmog-table'
import { DyePickerComponent } from '~/widgets/model-viewer/dye-picker.component'
import { CharacterEditorStore, DyeChannel, SHIELD_CATEGORIES, WEAPON_CATEGORIES } from './character-editor.store'
import { BodyPart, EQUIP_SLOTS } from './equip-rule'
import { WEAPON_SLOTS, WeaponSlotId } from './weapon-rule'

const WEAPON_LABELS: Record<WeaponSlotId, string> = {
  weapon1: 'Weapon 1',
  weapon2: 'Weapon 2',
  weapon3: 'Shield',
}

/**
 * The dye buttons of a slot: channel, its state key and label
 */
const DYE_CHANNELS: Array<{ key: 'r' | 'g' | 'b' | 'a'; channel: DyeChannel; label: string; debug: string }> = [
  { key: 'r', channel: 'dyeR', label: 'Primary dye color', debug: '#FF0000' },
  { key: 'g', channel: 'dyeG', label: 'Secondary dye color', debug: '#00FF00' },
  { key: 'b', channel: 'dyeB', label: 'Accent dye color', debug: '#0000FF' },
  { key: 'a', channel: 'dyeA', label: 'Tint dye color', debug: '#FF00FF' },
]

/**
 * The controls of the character editor: the slots (item, dyes, hidden body parts), gender and the view
 */
@Component({
  selector: 'nwb-character-editor-panel',
  templateUrl: './character-editor-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'flex flex-col gap-2',
  },
  providers: [provideTransmogCellOptions({ navigate: false, tooltips: true })],
})
export class CharacterEditorPanelComponent {
  /**
   * Read only: the slots and the gender stay, the view controls work
   */
  public readonly disabled = input(false)
  protected store = inject(CharacterEditorStore)
  private db = injectNwData()
  private modal = inject(ModalService)
  private injector = inject(Injector)

  protected iconEye = svgEye
  protected iconEyeSlash = svgEyeSlash
  protected iconPlay = svgPlay
  protected iconPause = svgPause
  protected fallbackIcon = NW_FALLBACK_ICON
  protected isMale = computed(() => this.store.gender() === 'male')
  /**
   * The animation time in seconds
   */
  protected animationTime = computed(() => `${this.store.animationProgress().time.toFixed(1)}s`)
  protected slots = computed(() => {
    const appearances = this.store.appearances()
    const dyes = this.store.dyes()
    const state = this.store.slots()
    const bodyParts = this.store.bodyParts()
    return EQUIP_SLOTS.map((id) => {
      return {
        id,
        slot: getEquipSlotForId(id),
        transmogId: state[id].item,
        appearance: appearances[id],
        dyes: DYE_CHANNELS.map((it) => {
          return { ...it, color: dyes[id][it.key], disabled: dyes[id][`${it.key}Disabled`] }
        }),
        hasDyes: !!(dyes[id].r || dyes[id].g || dyes[id].b || dyes[id].a),
        hides: bodyParts[id].map((part) => {
          return { ...part, tooltip: bodyPartTooltip(part) }
        }),
      }
    })
  })

  /**
   * The weapon slots: the picked appearance (the gender's variant) and the transmog categories of the picker
   */
  protected weapons = computed(() => {
    const appearances = this.store.weaponAppearances()
    return WEAPON_SLOTS.map((slot) => {
      return {
        slot,
        label: WEAPON_LABELS[slot],
        appearance: appearances[slot],
        categories: slot === 'weapon3' ? SHIELD_CATEGORIES : WEAPON_CATEGORIES,
      }
    })
  })
  /**
   * Drawing moves weapon 1 and the shield into the hands
   */
  protected canDrawWeapons = computed(() => {
    const appearances = this.store.weaponAppearances()
    return !!appearances.weapon1 || !!appearances.weapon3
  })

  protected pickWeapon(slot: WeaponSlotId, categories: string[]) {
    DataViewPicker.from({
      title: 'Select Weapon',
      injector: this.injector,
      displayMode: ['grid'],
      selection: [this.store.weapons()[slot]],
      dataView: {
        adapter: TransmogTableAdapter,
        filter: (item) => categories.includes(item.category),
      },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((list) => list[0]),
      )
      .subscribe((item) => this.store.setWeapon(slot, item ?? null))
  }

  protected pickItem(slot: EquipSlot) {
    DataViewPicker.from({
      title: 'Select Item',
      injector: this.injector,
      displayMode: ['grid'],
      selection: [this.store.slots()[slot.id as TransmogSlotId].item],
      dataView: {
        adapter: TransmogTableAdapter,
        filter: (item) => getTransmogCategory(item.category)?.itemClass?.includes(slot.itemType as any),
      },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((list) => list[0]),
      )
      .subscribe((item) => this.store.setItem(slot.id as TransmogSlotId, item ?? null))
  }

  /**
   * Picks an emote with clips, the picker answers with the lower case id
   */
  protected pickEmote() {
    DataViewPicker.from({
      title: 'Select Emote',
      injector: this.injector,
      displayMode: ['table'],
      selection: this.store.emote() ? [this.store.emote().toLowerCase()] : [],
      dataView: {
        adapter: EmoteTableAdapter,
        filter: (row) => !!this.store.emoteClipsMap()?.has(row.UniqueTagID),
      },
    })
      .pipe(
        filter((it) => it !== undefined),
        map((list) => list[0]),
      )
      .subscribe((id) => this.store.setEmote(this.store.emoteMap()?.get(id)?.UniqueTagID ?? null))
  }

  protected async pickDye(slot: TransmogSlotId, channel: DyeChannel, selection: DyeColorData | null) {
    DyePickerComponent.open(this.modal, {
      inputs: {
        colors: await this.db.dyeColorsAll(),
        color: selection,
      },
    })
      .result$.pipe(filter((it) => it !== undefined))
      .subscribe((value) => this.store.setDye(slot, channel, value?.Index ?? null))
  }

  protected toggleGender() {
    this.store.setGender(this.isMale() ? 'female' : 'male')
  }
}

function bodyPartTooltip(part: BodyPart): string {
  if (part.armor) {
    return `${part.attachment}: armor`
  }
  const cause = part.hiddenBy === 'character' ? 'default' : `the ${part.hiddenBy} item`
  if (part.hiddenBy && part.hidden) {
    return `${part.attachment}: hidden by ${cause}, click to show`
  }
  if (part.hiddenBy) {
    return `${part.attachment}: shown, hidden by ${cause}, click to hide`
  }
  if (part.hidden) {
    return `${part.attachment}: hidden, click to show`
  }
  return `${part.attachment}: click to hide`
}
