import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { saveAs } from 'file-saver'
import { DbService } from '~/data/db.service'
import { AppPreferencesService, ItemPreferencesService, PreferencesService } from '~/preferences'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { NwPricesImporterComponent } from './nw-marketprices-importer.component'

@Component({
  standalone: true,
  selector: 'nwb-preferences-page',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwPricesImporterComponent, PriceImporterModule],
  host: {
    class: 'layout-content layout-pad flex flex-col items-center'
  }
})
export class PreferencesComponent implements OnInit {
  public constructor(
    public readonly app: AppPreferencesService,
    public readonly preferences: PreferencesService,
    public readonly appDb: DbService,
    private readonly itemPref: ItemPreferencesService
  ) {
    //
  }

  public ngOnInit(): void {}

  public async exportPreferences() {
    const prefExport = this.preferences.export()
    prefExport['db:nw-buddy'] = await this.appDb.export()
    downloadJson(prefExport, 'nwb-preferences.json')
  }

  public async importPreferences() {
    const file = await openFile().catch(console.error)
    if (!file) {
      return
    }
    const content = await file.text()
    if (!content) {
      return
    }
    const data = JSON.parse(content)
    this.preferences.import(data)
    await this.appDb.import(data['db:nw-buddy'])
  }

  protected clearPrices() {
    this.itemPref.clearPrices()
  }
}

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data)], { type: 'text/json' })
  saveAs(blob, filename)
}

const openFile = async () => {
  return new Promise<File>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', () => {
      resolve(input.files[0]);
    });
    input.click();
  });
};
