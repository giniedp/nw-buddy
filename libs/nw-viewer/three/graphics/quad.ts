import { WebGLRenderer, BufferGeometry, Float32BufferAttribute, Material, Mesh, OrthographicCamera } from 'three'

export class ScreenQuadGeometry extends BufferGeometry {
  constructor() {
    super()

    // prettier-ignore
    this.setAttribute('position', new Float32BufferAttribute([
      -1, -1, 0,
      -1,  1, 0,
       1, -1, 0,
       1,  1, 0,
    ], 3))
    // prettier-ignore
    this.setAttribute('uv', new Float32BufferAttribute([
      0, 0,
      0, 1,
      1, 0,
      1, 1,
    ], 2))
    // prettier-ignore
    this.setIndex([
      0, 2, 1,
      2, 3, 1,
    ])
  }
}

const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
export class ScreenQuad extends Mesh {
  public constructor(material: Material) {
    super(new ScreenQuadGeometry(), material)
  }

  public render(renderer: WebGLRenderer) {
    renderer.render(this, camera)
  }
}
