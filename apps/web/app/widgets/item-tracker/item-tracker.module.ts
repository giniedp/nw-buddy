import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ItemTracker } from './item-tracker.component'
import { NwModule } from '~/nw'
import { FormsModule } from '@angular/forms'
import { ItemMarkerComponent } from './item-marker.component'

@NgModule({
  imports: [CommonModule, NwModule, FormsModule],
  declarations: [ItemTracker, ItemMarkerComponent, ItemMarkerComponent],
  exports: [ItemTracker, ItemMarkerComponent],
})
export class ItemTrackerModule {}
