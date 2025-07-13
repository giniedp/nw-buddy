import { computed, Directive, inject, input } from '@angular/core'
import { CharacterStore } from '~/data'

@Directive({
  selector: '[nwbItemMarker]',
  exportAs: 'itemMarker',
  standalone: false,
})
export class ItemMarkerDirective {
  private character = inject(CharacterStore)
  public itemId = input<string>(null, { alias: 'nwbItemMarker' })
  public value = computed(() => this.character.getItemMarker(this.itemId()))
}
