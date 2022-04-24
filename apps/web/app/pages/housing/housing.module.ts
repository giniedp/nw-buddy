import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { HousingRoutingModule } from './housing-routing.module'
import { HousingComponent } from './housing.component'
import { HousingDetailComponent } from './housing-detail.component'
import { PropertyGridModule } from '~/ui/property-grid'
import { FormsModule } from '@angular/forms'
import { ItemDetailModule } from '~/widgets/item-detail'
import { DataTableModule } from '~/ui/data-table'
import { SidebarModule } from '~/ui/sidebar'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HousingRoutingModule,
    DataTableModule,
    PropertyGridModule,
    ItemDetailModule,
    SidebarModule,
  ],
  declarations: [HousingComponent, HousingDetailComponent],
})
export class HousingModule {}
