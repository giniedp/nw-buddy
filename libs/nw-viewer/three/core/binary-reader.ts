//import { Type } from './utils'

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
   * The number of bytes remaining to read
   */
  public get remaining() {
    return this.data.byteLength - this.position
  }

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

  /**
   * Reads a single character from the current position without advancing the position.
   */
  public get char(): string {
    return String.fromCharCode(this.byte)
  }

  /**
   * Reads a single byte from the current position without advancing the position.
   */
  public get byte(): number {
    return this.data[this.position]
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
  public readByteArray(length: number): Int8Array {
    return new Int8Array(this.slice(length))
  }

  /**
   * Reads a specified number of bytes as a byte array
   *
   * @param length - The number of bytes to read
   */
  public readUByteArray(length: number): Uint8Array {
    return new Uint8Array(this.slice(length))
  }

  public readBuffer(buffer: number[]|Uint8Array, index: number, length: number) {
    let end = index + length
    while (index < end) {
      buffer[index++] = this.view.getUint8(this.position++)
    }
  }

  /**
   * Reads a single unsigned byte value
   */
  public readUByte(): number {
    return this.view.getUint8(this.position++)
  }

  /**
   * Reads a single signed byte value
   */
  public readByte(): number {
    return this.view.getInt8(this.position++)
  }

  /**
   * Reads a single unsigned short value
   */
  public readUShort(): number {
    let result = this.view.getUint16(this.position, this.littleEndian)
    this.position += 2
    return result
  }

  /**
   * Reads a single signed short value
   */
  public readShort(): number {
    let result = this.view.getInt16(this.position, this.littleEndian)
    this.position += 2
    return result
  }

  /**
   * Reads a single uint32 value
   */
  public readUInt(): number {
    let result = this.view.getUint32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  /**
   * Reads a single int32 value
   */
  public readInt(): number {
    let result = this.view.getInt32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  /**
   * Reads a two uint32 values as low and high bits.
   */
  public readLong(): number {
    let lo = this.readUInt()
    let hi = this.readUInt() << 32
    return hi + lo
  }

  /**
   * Reads a single float32 value
   */
  public readFloat(): number {
    let result = this.view.getFloat32(this.position, this.littleEndian)
    this.position += 4
    return result
  }

  /**
   * Reads a single float64 value
   */
  public readDouble(): number {
    let result = this.view.getFloat64(this.position, this.littleEndian)
    this.position += 8
    return result
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
   * Returns a section of the buffer starting at current position
   *
   * @param length - The length to slice
   */
  public slice(length: number): ArrayBuffer {
    this.position += length
    return this.data.slice(this.position - length, this.position)
  }

  public subarray(type: Type<Int16Array>, byteLength: number): Int16Array
  public subarray(type: Type<Int32Array>, byteLength: number): Int32Array
  public subarray(type: Type<Int8Array>, byteLength: number): Int8Array
  public subarray(type: Type<Uint16Array>, byteLength: number): Uint16Array
  public subarray(type: Type<Uint32Array>, byteLength: number): Uint32Array
  public subarray(type: Type<Uint8Array>, byteLength: number): Uint8Array
  public subarray(type: Type<Float32Array>, byteLength: number): Float32Array
  public subarray(type: Type<Float64Array>, byteLength: number): Float64Array
  public subarray(type: any, byteLength: number): any {
    const result = new type(this.data, this.position, byteLength / type.BYTES_PER_ELEMENT)
    this.position += byteLength
    return result
  }
}

export interface Type<T> extends Function { new (...args: any[]): T; }
export default BinaryReader
