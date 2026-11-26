import { Component, input, output } from '@angular/core'

/**
 * Status bar at the bottom of a panel tab: visible point count and a clear button
 */
@Component({
  selector: 'nwb-map-filter-status',
  template: `
    <span class="flex-1">
      <span class="font-mono">{{ visible() }}</span> visible points
    </span>
    @if (canClear()) {
      <button class="btn btn-xs btn-ghost text-xs" (click)="clear.emit()">Clear all</button>
    }
  `,
  host: {
    class:
      'sticky bottom-0 z-10 flex flex-row items-center gap-2 px-2 h-8 text-xs bg-base-300 border-t border-base-100',
  },
})
export class MapFilterStatusComponent {
  public visible = input<string>('0')
  public canClear = input<boolean>(false)
  public clear = output<void>()
}
