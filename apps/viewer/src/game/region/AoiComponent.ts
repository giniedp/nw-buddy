import type { ActivatableComponent, GameComponent, GameEntity } from '@gglib/ecs'

export interface AoiComponentOptions {
  range: number
}

export class AoiComponent implements GameComponent, ActivatableComponent {
  public readonly entity: GameEntity
  public readonly range: number

  public constructor(options: AoiComponentOptions) {
    this.range = options.range
  }

  public initialize(): void {
    //
  }
  public destroy(): void {
    //
  }
  public activate(): void {
    //
  }
  public deactivate(): void {
    //
  }
}
