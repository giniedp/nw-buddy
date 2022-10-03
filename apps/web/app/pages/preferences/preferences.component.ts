import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { NwTradeskillService } from '~/nw/nw-tradeskill.service'
import { AppPreferencesService, ItemPreferencesService, PreferencesService } from '~/preferences'
import { TradeskillPreferencesService } from '~/preferences/tradeskill-preferences.service'
import { NwPricesImporterComponent } from './nw-marketprices-importer.component'

@Component({
  standalone: true,
  selector: 'nwb-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwPricesImporterComponent]
})
export class PreferencesComponent implements OnInit {
  public constructor(
    public readonly app: AppPreferencesService,
    public readonly preferences: PreferencesService,
    private readonly itemPref: ItemPreferencesService
  ) {
    //
  }

  public ngOnInit(): void {}

  public exportPreferences() {
    downloadJson(this.preferences.export(), 'nwb-preferences.json')
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
    this.preferences.import(JSON.parse(content))
  }

  protected clearPrices() {
    this.itemPref.clearPrices()
  }
}

function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data)], { type: 'text/json' })
  const link = document.createElement('a')
  link.download = filename
  link.href = window.URL.createObjectURL(blob)
  link.dataset['downloadurl'] = ['text/json', link.download, link.href].join(':')
  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })

  link.dispatchEvent(evt)
  link.remove()
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
