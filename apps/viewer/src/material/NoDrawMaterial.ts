import { Device, Material } from '@gglib/graphics'

export class NowDrawMaterial extends Material {
  public constructor(device: Device) {
    super(device, {
      effect: null,
      properties: {},
    })
    this.noRender = true
  }
}
