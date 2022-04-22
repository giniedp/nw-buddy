import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { HousingRoutingModule } from './housing-routing.module'
import { HousingComponent } from './housing.component'
import { HousingTableModule } from '~/widgets/housing-table'
import { HousingDetailComponent } from './housing-detail.component'
import { PropertyGridModule } from '~/widgets/property-grid'
import { FormsModule } from '@angular/forms'
import { ItemDetailModule } from '~/widgets/item-detail'

@NgModule({
  imports: [CommonModule, FormsModule, HousingRoutingModule, HousingTableModule, PropertyGridModule, ItemDetailModule],
  declarations: [HousingComponent, HousingDetailComponent],
})
export class HousingModule {}
