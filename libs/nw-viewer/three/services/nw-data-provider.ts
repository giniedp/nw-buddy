import { NwData } from '../../../nw-data/db'
import { GameService, GameServiceContainer } from '../../ecs'

export interface TranslateService {
  getAsync(key: string): Promise<string>
}

export interface NwDataProviderOptions {
  nwData?: NwData
  tl8?: TranslateService
}

export class NwDataProvider implements GameService {
  public readonly db: NwData
  public readonly tl8: TranslateService
  public constructor(options: NwDataProviderOptions) {
    this.db = options?.nwData
    this.tl8 = options?.tl8
  }
  public initialize(host: GameServiceContainer): void {
    //
  }
  public destroy(): void {
    //
  }
}
