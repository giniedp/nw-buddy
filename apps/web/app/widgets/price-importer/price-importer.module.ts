import { NgModule } from '@angular/core'
import { PriceImporterButtonComponent } from './price-importer-button.component'
import { PriceImporterComponent } from './price-importer.component'

const components = [PriceImporterComponent, PriceImporterButtonComponent]

@NgModule({
  imports: [...components],
  exports: [...components],
})
export class PriceImporterModule {
  //
}
