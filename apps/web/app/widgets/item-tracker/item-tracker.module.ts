import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ItemTracker } from './item-tracker.component'
import { NwModule } from '~/core/nw'
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [CommonModule, NwModule, FormsModule],
  declarations: [ItemTracker],
  exports: [ItemTracker],
})
export class ItemTrackerModule {}
