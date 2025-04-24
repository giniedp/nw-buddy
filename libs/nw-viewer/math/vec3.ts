import { ArrayLike, IMat, IVec2, IVec3, IVec4 } from './types'
// import { hermite } from './utils/hermite'

const keyLookup = {
  0: 'x', 1: 'y', 2: 'z',
  x: 'x', y: 'y', z: 'z',
} as Record<number|string, 'x'|'y'|'z'>

/**
 * A vector with three components.
 *
 * @public
 */
export class Vec3 implements IVec2, IVec3 {

  /**
   * Readonly vector with all components set to zero
   */
  public static Zero: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: 0 })
  /**
   * Readonly vector with all components set to one
   */
  public static One: Readonly<IVec3> = Object.freeze<IVec3>({ x: 1, y: 1, z: 1 })
  /**
   * Readonly vector x component set to one
   */
  public static Right: Readonly<IVec3> = Object.freeze<IVec3>({ x: 1, y: 0, z: 0 })
  /**
   * Readonly vector x component set to minus one
   */
  public static Left: Readonly<IVec3> = Object.freeze<IVec3>({ x: -1, y: 0, z: 0 })
  /**
   * Readonly vector y component set to one
   */
  public static Up: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 1, z: 0 })
  /**
   * Readonly vector y component set to minus one
   */
  public static Down: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: -1, z: 0 })
  /**
   * Readonly vector z component set to one
   */
  public static Backward: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: 1 })
  /**
   * Readonly vector z component set to minus one
   */
  public static Forward: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: -1 })
  /**
   * Readonly vector x component set to one
   */
  public static UnitX: Readonly<IVec3> = Object.freeze<IVec3>({ x: 1, y: 0, z: 0 })
  /**
   * Readonly vector y component set to one
   */
  public static UnitY: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 1, z: 0 })
  /**
   * Readonly vector z component set to one
   */
  public static UnitZ: Readonly<IVec3> = Object.freeze<IVec3>({ x: 0, y: 0, z: 1 })

  /**
   * A temporary variable
   */
  public static readonly $0 = Vec3.create()
  /**
   * A temporary variable
   */
  public static readonly $1 = Vec3.create()
  /**
   * A temporary variable
   */
  public static readonly $2 = Vec3.create()

  /**
   * The X component
   */
  public x: number
  /**
   * The Y component
   */
  public y: number
  /**
   * The Z component
   */
  public z: number

  /**
   * Constructs a new instance of {@link Vec3}
   *
   * @param x - Value for the X component
   * @param y - Value for the Y component
   * @param z - Value for the Z component
   */
  constructor(x?: number, y?: number, z?: number) {
    this.x = x == null ? 0 : x
    this.y = y == null ? 0 : y
    this.z = z == null ? 0 : z
  }

  /**
   * Sets the X component
   */
  public setX(value: number): this {
    this.x = value
    return this
  }
  /**
   * Sets the Y component
   */
  public setY(value: number): this {
    this.y = value
    return this
  }
  /**
   * Sets the Z component
   */
  public setZ(value: number): this {
    this.z = value
    return this
  }
  /**
   * Sets the component by using an index (or name)
   */
  public set(key: number|string, value: number): this {
    this[keyLookup[key]] = value
    return this
  }
  /**
   * Gets the component by using an index (or name)
   */
  public get(key: number|string): number {
    return this[keyLookup[key]]
  }

  /**
   * Creates a new vector.
   *
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new vector.
   */
  public static create(x?: number, y?: number, z?: number): Vec3 {
    return new Vec3(x || 0, y || 0, z || 0)
  }

  /**
   * Initializes the given vector
   *
   * @param out - the vector to initialize
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   */
  public static init<T>(out: T, x: number, y: number, z: number): T & IVec3
  public static init(out: IVec3, x: number, y: number, z: number): IVec3 {
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Initializes the components of this vector with given values.
   *
   * @param x - value for X component
   * @param y - value for Y component
   * @param z - value for Z component
   */
  public init(x: number, y: number, z: number): this {
    this.x = x
    this.y = y
    this.z = z
    return this
  }

  /**
   * Creates a new vector with random values in range [0..1]
   *
   * @returns A new vector.
   */
  public static createRandom(): Vec3 {
    return new Vec3(Math.random(), Math.random(), Math.random())
  }

  /**
   * Initializes the given vector with random values in range [0..1]
   *
   * @param out - the vector to initialize
   */
  public static initRandom<T>(out: T): T & IVec3
  public static initRandom(out: IVec3): IVec3 {
    out.x = Math.random()
    out.y = Math.random()
    out.z = Math.random()
    return out
  }

  /**
   * Initializes the components of this vector with random values in range [0..1]
   */
  public initRandom(): this {
    this.x = Math.random()
    this.y = Math.random()
    this.z = Math.random()
    return this
  }

  /**
   * Creates a new vector with random values in range [-1..1]
   *
   * @returns A new vector.
   */
  public static createRandomUnit(): Vec3 {
    return new Vec3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
  }

  /**
   * Initializes the given vector with random values in range [-1..1]
   *
   * @param out - the vector to initialize
   */
  public static initRandomUnit<T>(out: T): T & IVec3
  public static initRandomUnit(out: IVec3): IVec3 {
    out.x = Math.random() * 2 - 1
    out.y = Math.random() * 2 - 1
    out.z = Math.random() * 2 - 1
    return out
  }

  /**
   * Initializes the components of this vector with random values in range [-1..1]
   */
  public initRandomUnit(): this {
    this.x = Math.random() * 2 - 1
    this.y = Math.random() * 2 - 1
    this.z = Math.random() * 2 - 1
    return this
  }

  /**
   * Creates a new vector with all components set to `0`
   *
   * @returns A new vector.
   */
  public static createZero(): Vec3 {
    return new Vec3(0, 0, 0)
  }

  /**
   * Initializes all components of given vector to `0`
   *
   * @param out - the vector to initialize
   */
  public static initZero<T>(out: T): T & IVec3
  public static initZero(out: IVec3): IVec3 {
    out.x = 0
    out.y = 0
    out.z = 0
    return out
  }

  /**
   * Initializes all components of this vector to `0`
   */
  public initZero(): this {
    this.x = 0
    this.y = 0
    this.z = 0
    return this
  }

  /**
   * Creates a new vector with all components set to `1`
   *
   * @returns A new vector.
   */
  public static createOne(): Vec3 {
    return new Vec3(1, 1, 1)
  }

  /**
   * Initializes all components of given vector to `1`
   *
   * @param out - the vector to initialize
   */
  public static initOne<T>(out: T): T & IVec3
  public static initOne(out: IVec3): IVec3 {
    out.x = 1
    out.y = 1
    out.z = 1
    return out
  }

  /**
   * Initializes all components of this vector to `1`
   */
  public initOne(): this {
    this.x = 1
    this.y = 1
    this.z = 1
    return this
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   *
   */
  public static createFrom(other: IVec3): Vec3 {
    return new Vec3(
      other.x,
      other.y,
      other.z,
    )
  }

  /**
   * Initializes the components of this vector by taking the components from the given vector.
   * @param other - The vector to read from
   *
   */
  public initFrom(other: IVec3): this {
    this.x = other.x
    this.y = other.y
    this.z = other.z
    return this
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param array - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public static createFromArray(array: ArrayLike<number>, offset: number= 0): Vec3 {
    return new Vec3(
      array[offset],
      array[offset + 1],
      array[offset + 2],
    )
  }

  /**
   * Initializes the components of this vector by taking values from the given array in successive order.
   * @param array - The array to read from
   * @param offset - The zero based index at which start reading the values
   *
   */
  public initFromArray(array: ArrayLike<number>, offset: number= 0): this {
    this.x = array[offset]
    this.y = array[offset + 1]
    this.z = array[offset + 2]
    return this
  }

  /**
   * Creates a vector from spherical coorinates
   *
   * @param theta - theta angle
   * @param phi - phi angle
   * @param scale - radius
   */
  public static createSpherical(theta: number, phi: number, radius: number = 1): Vec3 {
    return new Vec3(
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.cos(phi),
    )
  }

  /**
   * Initializes the components from spherical coorinates
   *
   * @param theta - theta angle
   * @param phi - phi angle
   * @param scale - radius
   */
  public initSpherical(theta: number, phi: number, radius: number = 1): this {
    this.x = radius * Math.sin(theta) * Math.sin(phi)
    this.y = radius * Math.cos(theta)
    this.z = radius * Math.sin(theta) * Math.cos(phi)
    return this
  }


  /**
   * Copies the source vector to the destination vector
   *
   *
   * @returns the destination vector.
   */
  public static clone(src: IVec3): Vec3
  public static clone<T>(src: IVec3, dst: T): T & IVec3
  public static clone(src: IVec3, dst?: IVec3): IVec3 {
    dst = dst || new Vec3()
    dst.x = src.x
    dst.y = src.y
    dst.z = src.z
    return dst
  }

  /**
   * Creates a copy of this vector
   * @returns The cloned vector
   */
  public clone(): Vec3
  public clone<T>(out: T): T & IVec3
  public clone(out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = this.x
    out.y = this.y
    out.z = this.z
    return out
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param vec - The vector to copy
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   *
   */
  public static toArray(vec: IVec3): number[]
  public static toArray<T>(vec: IVec3, array: T, offset?: number): T
  public static toArray(vec: IVec3, array: number[] = [], offset: number = 0): number[] {
    array[offset] = vec.x
    array[offset + 1] = vec.y
    array[offset + 2] = vec.z
    return array
  }

  /**
   * Copies the components successively into the given array.
   *
   * @param array - The array to copy into
   * @param offset - Zero based index where to start writing in the array
   *
   */
  public toArray(): number[]
  public toArray<T>(array: T, offset?: number): T
  public toArray(array: number[] = [], offset: number= 0): number[] {
    array[offset] = this.x
    array[offset + 1] = this.y
    array[offset + 2] = this.z
    return array
  }

  /**
   * Checks for component wise equality with given vector
   * @param other - The vector to compare with
   * @returns true if components are equal, false otherwise
   */
  public static equals(v1: IVec3, v2: IVec3): boolean {
    return ((v1.x === v2.x) && (v1.y === v2.y) && (v1.z === v2.z))
  }

  /**
   * Checks for component wise equality with given vector
   * @param other - The vector to compare with
   * @returns true if components are equal, false otherwise
   */
  public equals(other: IVec3): boolean {
    return ((this.x === other.x) && (this.y === other.y) && (this.z === other.z))
  }

  /**
   * Calculates the length of this vector
   *
   * @returns The length.
   */
  public static len(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the length of this vector
   * @returns The length.
   */
  public length(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared length of this vector
   *
   * @returns The squared length.
   */
  public static lengthSquared(vec: IVec3): number {
    const x = vec.x
    const y = vec.y
    const z = vec.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the squared length of this vector
   * @returns The squared length.
   */
  public lengthSquared(): number {
    const x = this.x
    const y = this.y
    const z = this.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the distance to the given vector
   *
   *
   * @returns The distance between the vectors.
   */
  public static distance(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the distance to the given vector
   * @param other - The distant vector
   * @returns The distance between the vectors.
   */
  public distance(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return Math.sqrt(x * x + y * y + z * z)
  }

  /**
   * Calculates the squared distance to the given vector
   *
   *
   * @returns The squared distance between the vectors.
   */
  public static distanceSquared(a: IVec3, b: IVec3): number {
    const x = a.x - b.x
    const y = a.y - b.y
    const z = a.z - b.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the squared distance to the given vector
   * @param other - The distant vector
   * @returns The squared distance between the vectors.
   */
  public distanceSquared(other: IVec3): number {
    const x = this.x - other.x
    const y = this.y - other.y
    const z = this.z - other.z
    return x * x + y * y + z * z
  }

  /**
   * Calculates the dot product with the given vector
   *
   *
   * @returns The dot product.
   */
  public static dot(a: IVec3, b: IVec3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  /**
   * Calculates the dot product with the given vector
   *
   * @returns The dot product.
   */
  public dot(other: IVec3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z
  }

  /**
   * Calculates the cross product between two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` argument or a new vector.
   */
  public static cross(vecA: IVec3, vecB: IVec3): Vec3
  public static cross<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static cross(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = vecA.y * vecB.z - vecA.z * vecB.y
    const y = vecA.z * vecB.x - vecA.x * vecB.z
    const z = vecA.x * vecB.y - vecA.y * vecB.x
    out.x = x
    out.y = y
    out.z = z
    return out
  }

  /**
   * Calculates the cross product with another vector.
   * @param other - The second vector.
   * @returns A new vector.
   */
  public cross(other: IVec3): this {
    const x = this.x
    const y = this.y
    const z = this.z
    this.x = y * other.z - z * other.y
    this.y = z * other.x - x * other.z
    this.z = x * other.y - y * other.x
    return this
  }

  /**
   * Normalizes the given vector.
   * @param vec - The vector to normalize.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static normalize(vec: IVec3): Vec3
  public static normalize<T>(vec: IVec3, out: T): T & IVec3
  public static normalize(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = vec.x
    const y = vec.y
    const z = vec.z
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
    out.x = x * d
    out.y = y * d
    out.z = z * d
    return out
  }

  /**
   * Normalizes `this` vector. Applies the result to `this` vector.
   */
  public normalize(): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = 1.0 / Math.sqrt(x * x + y * y + z * z)
    this.x *= d
    this.y *= d
    this.z *= d
    return this
  }

  /**
   * Inverts the given vector.
   * @param vec - The vector to invert.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static invert(vec: IVec3): Vec3
  public static invert<T>(vec: IVec3, out: T): T & IVec3
  public static invert(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = 1.0 / vec.x
    out.y = 1.0 / vec.y
    out.z = 1.0 / vec.z
    return out
  }

  /**
   * Inverts this vector.
   */
  public invert(): this {
    this.x = 1.0 / this.x
    this.y = 1.0 / this.y
    this.z = 1.0 / this.z
    return this
  }

  /**
   * Negates this vector.
   * @param vec - The vector to negate.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static negate(vec: IVec3): Vec3
  public static negate<T>(vec: IVec3, out: T): T & IVec3
  public static negate(vec: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = -vec.x
    out.y = -vec.y
    out.z = -vec.z
    return out
  }

  /**
   * Negates the components of `this` vector. Applies the result to `this`
   */
  public negate(): this {
    this.x = -this.x
    this.y = -this.y
    this.z = -this.z
    return this
  }

  /**
   * Adds two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static add(vecA: IVec3, vecB: IVec3): Vec3
  public static add<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static add(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x + vecB.x
    out.y = vecA.y + vecB.y
    out.z = vecA.z + vecB.z
    return out
  }

  /**
   * Performs the calculation `this += other`
   * @param other - The vector to add
   */
  public add(other: IVec3): this {
    this.x += other.x
    this.y += other.y
    this.z += other.z
    return this
  }

  /**
   * Adds a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static addScalar(vec: IVec3, scalar: number): Vec3
  public static addScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static addScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x + scalar
    out.y = vec.y + scalar
    out.z = vec.z + scalar
    return out
  }

  /**
   * Performs the calculation `this += scalar`
   * @param scalar - The value to add
   */
  public addScalar(scalar: number): this {
    this.x += scalar
    this.y += scalar
    this.z += scalar
    return this
  }

  /**
   * Performs the calculation `v1 + v2 * scale`
   * @returns The given `out` parameter or a new instance.
   */
  public static addScaled(v1: IVec3, v2: IVec3, scale: number): Vec3
  public static addScaled<T>(v1: IVec3, v2: IVec3, scale: number, out: T): T & IVec3
  public static addScaled(v1: IVec3, v2: IVec3, scale: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = v1.x + v2.x * scale
    out.y = v1.y + v2.y * scale
    out.z = v1.z + v2.z * scale
    return out
  }

  /**
   * Performs the calculation `this += other * scale`
   * @param other - The vector to add
   */
  public addScaled(other: IVec3, scale: number): this {
    this.x += other.x * scale
    this.y += other.y * scale
    this.z += other.z * scale
    return this
  }

  /**
   * Subtracts the second vector from the first.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtract(vecA: IVec3, vecB: IVec3): Vec3
  public static subtract<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static subtract(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x - vecB.x
    out.y = vecA.y - vecB.y
    out.z = vecA.z - vecB.z
    return out
  }

  /**
   * Performs the calculation `this -= other`
   * @param other - The vector to subtract
   */
  public subtract(other: IVec3): this {
    this.x -= other.x
    this.y -= other.y
    this.z -= other.z
    return this
  }

  /**
   * Subtracts a scalar from each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static subtractScalar(vec: IVec3, scalar: number): Vec3
  public static subtractScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static subtractScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x - scalar
    out.y = vec.y - scalar
    out.z = vec.z - scalar
    return out
  }

  /**
   * Performs the calculation `this -= scalar`
   * @param scalar - The value to subtract
   */
  public subtractScalar(scalar: number): this {
    this.x -= scalar
    this.y -= scalar
    this.z -= scalar
    return this
  }

  /**
   * Performs the calculation `v1 - v2 * scale`
   * @param other - The vector to add
   * @returns The given `out` parameter or a new vector.
   */
  public static subtractScaled(v1: IVec3, v2: IVec3, scale: number): Vec3
  public static subtractScaled<T>(v1: IVec3, v2: IVec3, scale: number, out: T): T & IVec3
  public static subtractScaled(v1: IVec3, v2: IVec3, scale: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = v1.x - v2.x * scale
    out.y = v1.y - v2.y * scale
    out.z = v1.z - v2.z * scale
    return out
  }

  /**
   * Performs the calculation `this -= other * scale`
   * @param other - The vector to subtract
   * @param scale - The value to multoply to `other`
   */
  public subtractScaled(other: IVec3, scale: number): this {
    this.x -= other.x * scale
    this.y -= other.y * scale
    this.z -= other.z * scale
    return this
  }

  /**
   * Performs the calculation `this *= other`
   * @param other - The vector to multiply
   */
  public multiply(other: IVec3): this {
    this.x *= other.x
    this.y *= other.y
    this.z *= other.z
    return this
  }

  /**
   * Multiplies two vectors.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiply(vecA: IVec3, vecB: IVec3): Vec3
  public static multiply<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static multiply(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x * vecB.x
    out.y = vecA.y * vecB.y
    out.z = vecA.z * vecB.z
    return out
  }

  /**
   * Multiplies a scalar to each component of a vector.
   * @param vec - The first vector.
   * @param scalar - The scalar to add.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyScalar(vec: IVec3, scalar: number): Vec3
  public static multiplyScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static multiplyScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    return out
  }

  /**
   * Performs the calculation `this *= scalar`
   * @param scalar - The value to multiply
   */
  public multiplyScalar(scalar: number): this {
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }

  /**
   * Divides the components of the first vector by the components of the second vector.
   * @param vecA - The first vector.
   * @param vecB - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divide(vecA: IVec3, vecB: IVec3): Vec3
  public static divide<T>(vecA: IVec3, vecB: IVec3, out: T): T & IVec3
  public static divide(vecA: IVec3, vecB: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x / vecB.x
    out.y = vecA.y / vecB.y
    out.z = vecA.z / vecB.z
    return out
  }

  /**
   * Performs the calculation `this /= other`
   * @param other - The vector to divide
   */
  public divide(other: IVec3): this {
    this.x /= other.x
    this.y /= other.y
    this.z /= other.z
    return this
  }

  /**
   * Divides the components of the first vector by the scalar.
   * @param vec - The first vector.
   * @param scalar - The scalar to use for division.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static divideScalar(vec: IVec3, scalar: number): Vec3
  public static divideScalar<T>(vec: IVec3, scalar: number, out: T): T & IVec3
  public static divideScalar(vec: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    scalar = 1.0 / scalar
    out.x = vec.x * scalar
    out.y = vec.y * scalar
    out.z = vec.z * scalar
    return out
  }

  /**
   * Performs the calculation `this *= (1 / scalar)`
   * @param scalar - The value to divide
   */
  public divideScalar(scalar: number): this {
    scalar = 1.0 / scalar
    this.x *= scalar
    this.y *= scalar
    this.z *= scalar
    return this
  }

  /**
   * Multiplies two vectors and adds the third vector.
   * @param vecA - The vector to multiply.
   * @param vecB - The vector to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyAdd(vecA: IVec3, vecB: IVec3, add: IVec3): Vec3
  public static multiplyAdd<T>(vecA: IVec3, vecB: IVec3, add: IVec3, out: T): T & IVec3
  public static multiplyAdd(vecA: IVec3, vecB: IVec3, add: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x * vecB.x + add.x
    out.y = vecA.y * vecB.y + add.y
    out.z = vecA.z * vecB.z + add.z
    return out
  }

  /**
   * Multiplies a vector with a scalar and adds another vector.
   * @param vecA - The vector to multiply.
   * @param mul - The scalar to multiply.
   * @param add - The vector to add on top of the multiplication.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static multiplyScalarAdd(vecA: IVec3, mul: number, add: IVec3): Vec3
  public static multiplyScalarAdd<T>(vecA: IVec3, mul: number, add: IVec3, out: T): T & IVec3
  public static multiplyScalarAdd(vecA: IVec3, mul: number, add: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    out.x = vecA.x * mul + add.x
    out.y = vecA.y * mul + add.y
    out.z = vecA.z * mul + add.z
    return out
  }

  /**
   * Performs the calculation `this = this * a + b`
   * @param a - The vector to multiply.
   * @param b - The vector to add on top of the multiplication.
   */
  public multiplyAdd(a: IVec3, b: IVec3): this {
    this.x = this.x * a.x + b.x
    this.y = this.y * a.y + b.y
    this.z = this.z * a.z + b.z
    return this
  }

  /**
   * Reflects this vector along the given `normal`
   *
   * @param normal - the normal used for reflection
   */
  public reflect(normal: IVec3): this {
    const dot = this.x * normal.x + this.y * normal.y + this.z * normal.z
    this.x = this.x - (2.0 * dot * normal.x)
    this.y = this.y - (2.0 * dot * normal.y)
    this.z = this.z - (2.0 * dot * normal.z)
    return this
  }

  /**
   * Creates a new vector that is the reflected of `vec`
   *
   * @param vec - the vector to reflect
   * @param normal - the normal
   */
  public static reflect(vec: IVec3, normal: IVec3): Vec3
  /**
   * Reflects the `vec` and writes the result to `out`
   *
   * @param vec - the vector to reflect
   * @param normal - the normal
   * @param out - The vector to write to
   */
  public static reflect<T>(vec: IVec3, normal: IVec3, out: T): T & IVec3
  public static reflect(vec: IVec3, normal: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
    out.x = vec.x - (2.0  * dot * normal.x)
    out.y = vec.y - (2.0  * dot * normal.y)
    out.z = vec.z - (2.0  * dot * normal.z)
    return out
  }

  /**
   * Refracts this vector
   *
   * @param normal - a normal vector
   * @param eta - refraction index
   */
  public refract(normal: IVec3, eta: number): this {
    const dot = this.x * normal.x + this.y * normal.y + this.z * normal.z
    const k = 1.0 - eta * eta * (1.0 - dot * dot)
    if (k < 0) {
      this.x = 0
      this.y = 0
      this.z = 0
    } else {
      const sqrt = Math.sqrt(k)
      this.x = eta * this.x - (eta * dot + sqrt) * normal.x
      this.y = eta * this.y - (eta * dot + sqrt) * normal.y
      this.z = eta * this.z - (eta * dot + sqrt) * normal.z
    }
    return this
  }

  /**
   * Creates a new vector that is the refracted of `vec`
   *
   * @param vec - the vector to refract
   * @param normal - the normal
   * @param eta - refraction index
   */
  public static refract(vec: IVec3, normal: IVec3, eta: number): Vec3
  /**
   * Refreacts the `vec` but writes the result to `out`
   *
   * @param vec - the vector to refract
   * @param normal - the normal
   * @param eta - refraction index
   * @param out - The vector to write to
   */
  public static refract<T>(vec: IVec3, normal: IVec3, eta: number, out?: T): T & IVec3
  public static refract(vec: IVec3, normal: IVec3, eta: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const dot = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z
    const k = 1.0 - eta * eta * (1.0 - dot * dot)
    if (k < 0) {
      out.x = 0
      out.y = 0
      out.z = 0
    } else {
      const sqrt = Math.sqrt(k)
      out.x = eta * vec.x - (eta * dot + sqrt) * normal.x
      out.y = eta * vec.y - (eta * dot + sqrt) * normal.y
      out.z = eta * vec.z - (eta * dot + sqrt) * normal.z
    }
    return out
  }

  /**
   * Transforms `this` with the given quaternion.
   *
   */
  public transformByQuat(quat: IVec4): this {
    const x = quat.x
    const y = quat.y
    const z = quat.z
    const w = quat.w

    const x2 = x + x
    const y2 = y + y
    const z2 = z + z

    const wx2 = w * x2
    const wy2 = w * y2
    const wz2 = w * z2

    const xx2 = x * x2
    const xy2 = x * y2
    const xz2 = x * z2

    const yy2 = y * y2
    const yz2 = y * z2
    const zz2 = z * z2

    const vx = this.x
    const vy = this.y
    const vz = this.z

    this.x = vx * (1 - yy2 - zz2) + vy * (xy2 - wz2) + vz * (xz2 + wy2)
    this.y = vx * (xy2 + wz2) + vy * (1 - xx2 - zz2) + vz * (yz2 - wx2)
    this.z = vx * (xz2 - wy2) + vy * (yz2 + wx2) + vz * (1 - xx2 - yy2)
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   */
  public transformByMat4(mat: IMat): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const w = 1
    const d = mat.m
    this.x = x * d[0] + y * d[4] + z * d[8] + w * d[12]
    this.y = x * d[1] + y * d[5] + z * d[9] + w * d[13]
    this.z = x * d[2] + y * d[6] + z * d[10] + w * d[14]
    return this
  }

  /**
   * Transforms `this` with the given matrix.
   *
   */
  public transformByMat3(mat: IMat): this {
    const x = this.x
    const y = this.y
    const z = this.z
    const d = mat.m
    this.x = x * d[0] + y * d[3] + z * d[6]
    this.y = x * d[1] + y * d[4] + z * d[7]
    this.z = x * d[2] + y * d[5] + z * d[8]
    return this
  }

  /**
   * Transforms `this` with the given matrix. The `z` component of `this` keeps untouched.
   *
   */
  public transformByMat2(mat: IMat): this {
    const x = this.x
    const y = this.y
    const d = mat.m
    this.x = x * d[0] + y * d[2]
    this.y = x * d[1] + y * d[3]
    return this
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max vectors.
   * @param a - The vector to clamp.
   * @param min - Vector with the minimum component values.
   * @param max - Vector with the maximum component values.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static clamp<T extends IVec3 = Vec3>(a: IVec3, min: IVec3, max: IVec3, out?: T|Vec3): T|Vec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    const minX = min.x
    const minY = min.y
    const minZ = min.z
    const maxX = max.x
    const maxY = max.y
    const maxZ = max.z
    out.x = x < minX ? minX : (x > maxX ? maxX : x)
    out.y = y < minY ? minY : (y > maxY ? maxY : y)
    out.z = z < minZ ? minZ : (z > maxZ ? maxZ : z)
    return out
  }

  /**
   * Performs a component wise clamp operation on the the given vector by using the given min and max scalars.
   * @param a - The vector to clamp.
   * @param min - The minimum scalar value.
   * @param max - The maximum scalar value.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static clampScalar(a: IVec3, min: number, max: number): Vec3
  public static clampScalar<T>(a: IVec3, min: number, max: number, out?: T): T & IVec3
  public static clampScalar(a: IVec3, min: number, max: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x < min ? min : (x > max ? max : x)
    out.y = y < min ? min : (y > max ? max : y)
    out.z = z < min ? min : (z > max ? max : z)
    return out
  }

  /**
   * Performs a component wise min operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static min(a: IVec3, b: IVec3): Vec3
  public static min<T>(a: IVec3, b: IVec3, out?: T): T & IVec3
  public static min(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    out.x = aX < bX ? aX : bX
    out.y = aY < bY ? aY : bY
    out.z = aZ < bZ ? aZ : bZ
    return out
  }

  /**
   * Performs a component wise min operation on the the given vector and a scalar value.
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static minScalar(a: IVec3, scalar: number): Vec3
  public static minScalar<T>(a: IVec3, scalar: number, out?: T): T & IVec3
  public static minScalar(a: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x < scalar ? x : scalar
    out.y = y < scalar ? y : scalar
    out.z = z < scalar ? z : scalar
    return out
  }

  /**
   * Performs a component wise max operation on the the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static max(a: IVec3, b: IVec3): Vec3
  public static max<T>(a: IVec3, b: IVec3, out?: T): T & IVec3
  public static max(a: IVec3, b: IVec3, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const aX = a.x
    const aY = a.y
    const aZ = a.z
    const bX = b.x
    const bY = b.y
    const bZ = b.z
    out.x = aX > bX ? aX : bX
    out.y = aY > bY ? aY : bY
    out.z = aZ > bZ ? aZ : bZ
    return out
  }

  /**
   * Performs a component wise max operation on the the given vector and a scalar value.
   * @param a - The vector.
   * @param scalar - The scalar.
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static maxScalar(a: IVec3, scalar: number): Vec3
  public static maxScalar<T>(a: IVec3, scalar: number, out?: T): T & IVec3
  public static maxScalar(a: IVec3, scalar: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x > scalar ? x : scalar
    out.y = y > scalar ? y : scalar
    out.z = z > scalar ? z : scalar
    return out
  }

  /**
   * Performs a component wise linear interpolation between the given two vectors.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static lerp(a: IVec3, b: IVec3, t: number): Vec3
  public static lerp<T>(a: IVec3, b: IVec3, t: number, out?: T): T & IVec3
  public static lerp(a: IVec3, b: IVec3, t: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
    return out
  }

  // /**
  //  * Performs a component wise hermite interpolation between the given two vectors.
  //  *
  //  * @param a - The first vector.
  //  * @param b - The second vector.
  //  * @param t - The interpolation value. Assumed to be in range [0:1].
  //  * @param out - The vector to write to.
  //  * @returns The given `out` parameter or a new vector.
  //  */
  // public static hermite(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number): Vec3
  // public static hermite<T>(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number, out?: T): T & IVec3
  // public static hermite(a: IVec3, ta: IVec3, b: IVec3, tb: IVec3, t: number, out?: IVec3): IVec3 {
  //   out = out || new Vec3()
  //   out.x = hermite(a.x, ta.x, b.x, tb.x, t)
  //   out.y = hermite(a.y, ta.y, b.y, tb.y, t)
  //   out.z = hermite(a.z, ta.z, b.z, tb.z, t)
  //   return out
  // }

  /**
   * Performs a component wise barycentric interpolation of the given vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param c - The third vector.
   * @param t1 - The first interpolation value. Assumed to be in range [0:1].
   * @param t2 - The second interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static barycentric(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number): Vec3
  public static barycentric<T>(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: T): T & IVec3
  public static barycentric(a: IVec3, b: IVec3, c: IVec3, t1: number, t2: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + t1 * (b.x - x) + t2 * (c.x - x)
    out.y = y + t1 * (b.y - y) + t2 * (c.y - y)
    out.z = z + t1 * (b.z - z) + t2 * (c.z - z)
    return out
  }

  /**
   * Performs a component wise smooth interpolation between the given two vectors.
   * @param a - The first vector.
   * @param b - The second vector.
   * @param t - The interpolation value. Assumed to be in range [0:1].
   * @param out - The vector to write to.
   * @returns The given `out` parameter or a new vector.
   */
  public static smooth(a: IVec3, b: IVec3, t: number): Vec3
  public static smooth<T>(a: IVec3, b: IVec3, t: number, out?: T): T & IVec3
  public static smooth(a: IVec3, b: IVec3, t: number, out?: IVec3): IVec3 {
    out = out || new Vec3()
    t = ((t > 1) ? 1 : ((t < 0) ? 0 : t))
    t = t * t * (3 - 2 * t)
    const x = a.x
    const y = a.y
    const z = a.z
    out.x = x + (b.x - x) * t
    out.y = y + (b.y - y) * t
    out.z = z + (b.z - z) * t
    return out
  }

  /**
   * Tries to converts the given data to a vector
   */
  public static convert(data: number | IVec3 | number[]): Vec3 {
    if (typeof data === 'number') {
      return new Vec3(data, data, data)
    }
    if (Array.isArray(data)) {
      return new Vec3(data[0], data[1], data[2])
    }
    return new Vec3(data.x, data.y, data.z)
  }

  /**
   * Formats this into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param fractionDigits - Number of digits after decimal point
   */
  public format(fractionDigits?: number): string {
    return Vec3.format(this, fractionDigits)
  }

  /**
   * Formats given value into a readable string
   *
   * @remarks
   * Mainly meant for debugging. Do not use this for serialization.
   *
   * @param vec - The value to format
   * @param fractionDigits - Number of digits after decimal point
   */
  public static format(vec: IVec3, fractionDigits: number = 5): string {
    return vec.x.toFixed(fractionDigits) +
      ',' + vec.y.toFixed(fractionDigits) +
      ',' + vec.z.toFixed(fractionDigits)
  }
}
