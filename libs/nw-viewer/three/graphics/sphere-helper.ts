import { LineBasicMaterial, LineSegments, Sphere, SphereGeometry } from 'three'

export class SphereHelper extends LineSegments {
  public override type = 'SphereHelper'
  public sphere: Sphere
  constructor(sphere: Sphere, color = 0xffff00) {
    const geometry = new SphereGeometry(1, 8, 8)
    super(geometry, new LineBasicMaterial({ color: color, toneMapped: false }))

    this.sphere = sphere
    this.type = 'Box3Helper'
    this.geometry.computeBoundingSphere()
  }

  public override updateMatrixWorld(force?: boolean) {
    const sphere = this.sphere

    if (sphere.isEmpty()) {
      return
    }

    this.position.copy(sphere.center)
    this.scale.set(1, 1, 1)
    this.scale.multiplyScalar(sphere.radius)

    super.updateMatrixWorld(force)
  }

  public dispose() {
    this.geometry.dispose()
    if (Array.isArray(this.material)) {
      for (const material of this.material) {
        material.dispose()
      }
    } else {
      this.material?.dispose()
    }
  }
}
