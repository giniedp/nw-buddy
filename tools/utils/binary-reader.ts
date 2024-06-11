/**
 * A wrapper around the ArrayBuffer and DataView. Simplifies reading binary data.
 *
 * @public
 */
export class BinaryReader {
  /**
   * The underlying data to read
   */
  public readonly data: ArrayBuffer

  /**
   * The data view allowing to access the data
   */
  public readonly view: DataView

  /**
   * The current position
   */
  public position: number

  /**
   * Byte order to read. Default is `true`
   */
  public littleEndian = true

  /**
   * Creates a new instance of {@link BinaryReader}
   *
   * @param data - The data to read
   */
  constructor(data: ArrayBuffer) {
    this.data = data
    this.view = new DataView(this.data)
    this.position = 0
  }

  /**
   * Checks whether the readers position has not reached the end of the buffer
   */
  public get canRead() {
    return this.position < this.data.byteLength
  }

  public get byte() {
    return this.view.getUint8(this.position)
  }

  public get length() {
    return this.data.byteLength
  }

  public get remaining() {
    return this.data.byteLength - this.position
  }
  /**
   * Reads a specified number of bytes
   *
   * @param length - The number of bytes to read
   * @param output - The destination array to read into
   */
  public readBytes(length: number, output: number[] = []): number[] {
    while (length > 0) {
      output.push(this.view.getUint8(this.position++))
      length--
    }
    return output
  }

  /**
   * Reads a specified number of bytes as a byte array
   *
   * @param length - The number of bytes to read
   */
  public readByteTypedArray(length: number): Int8Array {
    return new Int8Array(this.slice(length))
  }

  public readBuffer(buffer: number[] | Uint8Array, index: number, length: number) {
    let end = index + length
    while (index < end) {
      buffer[index++] = this.view.getUint8(this.position++)
    }
  }

  /**
   * Reads a single unsigned byte value
   */
  public readUInt8(): number {
    return this.view.getUint8(this.position++)
  }

  public readUInt8TypedArray(length: number): Uint8Array {
    return new Uint8Array(this.slice(length))
  }

  public readUInt8Array(length: number): number[] {
    return this.readArray(length, () => this.readUInt8())
  }

  /**
   * Reads a single signed byte value
   */
  public readInt8(): number {
    return this.view.getInt8(this.position++)
  }

  public readInt8TypedArray(length: number): Int8Array {
    return new Int8Array(this.slice(length))
  }

  public readInt8Array(length: number): number[] {
    return this.readArray(length, () => this.readInt8())
  }

  /**
   * Reads a single unsigned short value
   */
  public readUInt16(): number {
    let result = this.view.getUint16(this.position, this.littleEndian)
    this.position += 2
    return result
  }

  public readUInt16TypedArray(length: number): Uint16Array {
    return new Uint16Array(this.slice(length * 2))
  }

  public readUInt16Array(length: number): number[] {
    return this.readArray(length, () => this.readUInt16())
  }

  /**
   * Reads a single signed short value
   */
  public readInt16(): number {
    let result = this.view.getInt16(this.position, this.littleEndian)
    this.position += 2
    return result
  }

  public readInt16TypedArray(length: number): Int16Array {
    return new Int16Array(this.slice(length * 2))
  }

  public readInt16Array(length: number): number[] {
    return this.readArray(length, () => this.readInt16())
  }

  /**
   * Reads a single uint32 value
   */
  public readUInt32(): number {
    let result = this.view.getUint32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readUInt32TypedArray(length: number): Uint32Array {
    return new Uint32Array(this.slice(length * 4))
  }

  public readUInt32Array(length: number): number[] {
    return this.readArray(length, () => this.readUInt32())
  }

  /**
   * Reads a single int32 value
   */
  public readInt32(): number {
    let result = this.view.getInt32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readInt32TypedArray(length: number): Int32Array {
    let result = new Int32Array(length)
    for (let i = 0; i < length; i++) {
      result[i] = this.readInt32()
    }
    return result
  }

  public readInt32Array(length: number): number[] {
    return this.readArray(length, () => this.readInt32())
  }

  /**
   * Reads a two uint32 values as low and high bits.
   */
  public readInt64(): number {
    let lo = this.readUInt32()
    let hi = this.readUInt32() << 32
    return hi + lo
  }

  public readInt64Array(length: number): number[] {
    return this.readArray(length, () => this.readInt64())
  }

  /**
   * Reads a single float32 value
   */
  public readFloat32(): number {
    let result = this.view.getFloat32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  public readFloat32TypedArray(length: number): Float32Array {
    return new Float32Array(this.slice(length * 4))
  }

  public readFloat32Array(length: number): number[] {
    return this.readArray(length, () => this.readFloat32())
  }

  /**
   * Reads a single float64 value
   */
  public readFloat64(): number {
    let result = this.view.getFloat64(this.position, this.littleEndian)
    this.position += 8
    return result
  }

  public readFloat64TypedArray(length: number): Float64Array {
    return new Float64Array(this.slice(length * 8))
  }

  public readFloat64Array(length: number): number[] {
    return this.readArray(length, () => this.readFloat64())
  }

  /**
   * Jumps to the given position on the data array
   *
   * @param position - The new index
   */
  public seekAbsolute(position: number) {
    this.position = position
  }

  /**
   * Jumps to the given position (relative to the current postion) on the data array
   *
   * @param position - The new relative position
   */
  public seekRelative(position: number) {
    this.position += position
  }

  /**
   * Reads a string
   *
   * @param length - The length in bytes to read
   */
  public readString(length: number): string {
    let result = []
    while (length > 0) {
      result.push(String.fromCharCode(this.view.getUint8(this.position++)))
      length--
    }
    return result.join('')
  }

  /**
   * Reads a string
   *
   * @param length - The length in bytes to read
   */
  public readStringNT(fixedSize: number = null): string {
    const start = this.position
    let result = []
    while (this.canRead) {
      const byte = this.view.getUint8(this.position++)
      if (byte === 0) {
        break
      }
      result.push(String.fromCharCode(byte))
    }
    if (fixedSize) {
      this.position = start + fixedSize
    }
    return result.join('')
  }

  public readUUID() {
    return this.readBytes(16)
      .map((it): string => {
        return it.toString(16).padStart(2, '0')
      })
      .join('')
  }

  /**
   * Returns a section of the buffer starting at current position
   *
   * @param length - The length to slice
   */
  public slice(length: number): ArrayBuffer {
    this.position += length
    return this.data.slice(this.position - length, this.position)
  }

  public readArray<T>(size: number, read: (r: BinaryReader) => T): T[] {
    let result = []
    for (let i = 0; i < size; i++) {
      result.push(read(this))
    }
    return result
  }

  public alignPosition(alignment: number) {
    this.position = Math.ceil(this.position / alignment) * alignment
  }
}
