import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IconsModule } from '~/ui/icons'

@Component({
  selector: 'nwb-npc-detail-map',
  templateUrl: './npc-detail-map.component.html',
  imports: [IconsModule, FormsModule],
  host: {
    class: 'block hidden',
  },
})
export class NpcDetailMapComponent {}
