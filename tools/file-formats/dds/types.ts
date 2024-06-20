export interface DDSHeader {
  size: number
  flags: number
  height: number
  width: number
  pitchOrLinearSize: number
  depth: number
  mipMapCount: number
  reserved: number[]
  pixelFormat: {
    size: number
    flags: number
    fourCC: string
    rgbBitCount: number
    rBitMask: number
    gBitMask: number
    bBitMask: number
    aBitMask: number
  }
  caps: number
  caps2: number
  caps3: number
  caps4: number
  reserved6: number
}

export interface DX10Header {
  dxgiFormat: number
  resourceDimension: number
  miscFlag: number
  arraySize: number
  miscFlags2: number
}
