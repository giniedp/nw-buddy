import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { CharacterStore } from '~/data'

@Component({
  selector: 'nwb-item-marker',
  templateUrl: './item-marker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  host: {
    class: 'flex flex-row',
  },
  standalone: false,
})
export class ItemMarkerComponent {
  private character = inject(CharacterStore)
  public itemId = input<string>()
  public hasValue = computed(() => !!this.flags())
  private flags = computed(() => cleanValue(this.character.getItemMarker(this.itemId())))

  public toggle(index: number) {
    let result = this.flags()
    if (this.checked(index)) {
      result = result & ~indexValue(index)
    } else {
      result = result | indexValue(index)
    }
    this.submitValue(result)
  }

  public checked(index: number) {
    return !!(this.flags() & indexValue(index))
  }

  private submitValue(value: number | string) {
    this.character.setItemMarker(this.itemId(), cleanValue(value))
  }
}

function indexValue(index: number) {
  return Math.pow(2, index)
}
function cleanValue(value: string | number | boolean) {
  if (typeof value !== 'number') {
    value = Number(value)
  }
  if (Number.isFinite(value)) {
    return value
  }
  return null
}
