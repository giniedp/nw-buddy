import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { saveAs } from 'file-saver'
import { DbService } from '~/data/db.service'
import { AppPreferencesService, ItemPreferencesService, PreferencesService } from '~/preferences'
import { ConfirmDialogComponent, LayoutModule } from '~/ui/layout'
import { HtmlHeadService } from '~/utils'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'

@Component({
  standalone: true,
  selector: 'nwb-preferences-page',
  templateUrl: './preferences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, PriceImporterModule, LayoutModule, RouterModule],
  host: {
    class: 'layout-content layout-pad flex flex-col items-center'
  }
})
export class PreferencesComponent implements OnInit {

  protected get tooltipProvider() {
    return this.app.tooltipProvider.get()
  }
  protected set tooltipProvider(value: string) {
    this.app.tooltipProvider.set(value as any)
  }


  protected get web3token() {
    return this.app.web3token.get()
  }
  protected set web3token(value: string) {
    this.app.web3token.set(value as any)
  }

  protected get web3gateway() {
    return this.app.web3gateway.get()
  }
  protected set web3gateway(value: string) {
    this.app.web3gateway.set(value as any)
  }

  public constructor(
    public app: AppPreferencesService,
    public preferences: PreferencesService,
    public appDb: DbService,
    private itemPref: ItemPreferencesService,
    private dialog: Dialog,
    head: HtmlHeadService) {
      head.updateMetadata({
        title: 'Preferences',
        description: 'Personal preferences to adjust your New World Buddy experience'
      })
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

    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Import complete',
        body: 'Data was successfully imported',
        positive: 'OK'
      }
    })
  }

  protected clearPrices() {
    this.itemPref.clearPrices()
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Prices cleared',
        body: 'All item prices have been cleared',
        positive: 'OK'
      }
    })
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
