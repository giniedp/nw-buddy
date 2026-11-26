/**
 * Little endian cursor over a byte range. Every read is bounds checked and throws {@link WwiseReadError} on truncation,
 * so typed parsers can validate a layout by simply running to the end of an object.
 */
export class WwiseReader {
  public readonly view: DataView
  public readonly end: number
  public offset: number

  public constructor(buffer: ArrayBufferLike | ArrayBufferView, offset = 0, length?: number) {
    if (ArrayBuffer.isView(buffer)) {
      this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    } else {
      this.view = new DataView(buffer)
    }
    this.offset = offset
    this.end = length === undefined ? this.view.byteLength : offset + length
    if (this.end > this.view.byteLength) {
      throw new WwiseReadError(`range ${offset}+${length} exceeds buffer of ${this.view.byteLength} bytes`)
    }
  }

  public get remaining() {
    return this.end - this.offset
  }

  public skip(count: number) {
    this.ensure(count)
    this.offset += count
    return this
  }

  public u8() {
    this.ensure(1)
    return this.view.getUint8(this.offset++)
  }

  public u16() {
    this.ensure(2)
    const value = this.view.getUint16(this.offset, true)
    this.offset += 2
    return value
  }

  public i16() {
    this.ensure(2)
    const value = this.view.getInt16(this.offset, true)
    this.offset += 2
    return value
  }

  public u32() {
    this.ensure(4)
    const value = this.view.getUint32(this.offset, true)
    this.offset += 4
    return value
  }

  public i32() {
    this.ensure(4)
    const value = this.view.getInt32(this.offset, true)
    this.offset += 4
    return value
  }

  public f32() {
    this.ensure(4)
    const value = this.view.getFloat32(this.offset, true)
    this.offset += 4
    return value
  }

  public f64() {
    this.ensure(8)
    const value = this.view.getFloat64(this.offset, true)
    this.offset += 8
    return value
  }

  public tag() {
    this.ensure(4)
    let result = ''
    for (let i = 0; i < 4; i++) {
      result += String.fromCharCode(this.view.getUint8(this.offset + i))
    }
    this.offset += 4
    return result
  }

  /**
   * Wwise 7-bit variable length integer (big endian groups, continuation bit 0x80)
   */
  public var() {
    let byte = this.u8()
    let value = byte & 0x7f
    let loops = 0
    while (byte & 0x80) {
      if (++loops > 4) {
        throw new WwiseReadError(`var int too long at ${this.offset}`)
      }
      byte = this.u8()
      value = value * 128 + (byte & 0x7f)
    }
    return value
  }

  /**
   * Reads a count and guards against garbage values, assuming each item occupies at least `itemSize` bytes
   */
  public count(value: number, itemSize: number, what: string) {
    if (value * itemSize > this.remaining) {
      throw new WwiseReadError(`${what} count ${value} exceeds the remaining ${this.remaining} bytes at ${this.offset}`)
    }
    return value
  }

  private ensure(count: number) {
    if (this.offset + count > this.end) {
      throw new WwiseReadError(`read of ${count} bytes at ${this.offset} exceeds end ${this.end}`)
    }
  }
}

export class WwiseReadError extends Error {
  public override name = 'WwiseReadError'
}
