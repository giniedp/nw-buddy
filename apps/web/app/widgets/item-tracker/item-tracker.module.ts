import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ItemTracker } from './item-tracker.component'
import { NwModule } from '~/nw'
import { FormsModule } from '@angular/forms'
import { ItemMarkerComponent } from './item-marker.component'
import { ItemMarkerDirective } from './item-marker.directive'

@NgModule({
  imports: [CommonModule, NwModule, FormsModule],
  declarations: [ItemTracker, ItemMarkerComponent, ItemMarkerComponent, ItemMarkerDirective],
  exports: [ItemTracker, ItemMarkerComponent, ItemMarkerDirective],
})
export class ItemTrackerModule {}
