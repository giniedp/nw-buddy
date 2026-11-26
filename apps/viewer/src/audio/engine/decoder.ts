/**
 * Decodes Wwise media (`.wem`, Wwise Vorbis and friends) with the vgmstream WebAssembly build.
 *
 * @remarks
 * The Emscripten glue (`vgmstream-cli.js`) defines `Module`, `FS` and `callMain` as globals, so it is evaluated at
 * global scope (indirect eval) like vgmstream-web does in its worker. One decode runs `vgmstream-cli -o out.wav in.wem`
 * on the in-memory file system. Runs in a worker (or Node for offline tests), not on the main thread.
 */
export class VgmstreamDecoder {
  private global: any
  private counter = 0

  private constructor(global: any) {
    this.global = global
  }

  /**
   * Loads the vgmstream glue and wasm from `baseUrl` (folder containing `vgmstream-cli.js` and `vgmstream-cli.wasm`)
   */
  public static async load(baseUrl: string): Promise<VgmstreamDecoder> {
    const global: any = globalThis
    const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
    const glue = await fetch(url + 'vgmstream-cli.js').then((r) => {
      if (!r.ok) {
        throw new Error(`vgmstream-cli.js: ${r.status}`)
      }
      return r.text()
    })
    await new Promise<void>((resolve, reject) => {
      global.Module = {
        noInitialRun: true,
        print: () => {},
        printErr: () => {},
        locateFile: (name: string) => url + name,
        onRuntimeInitialized: () => resolve(),
        onAbort: (reason: unknown) => reject(new Error(`vgmstream aborted: ${reason}`)),
      }
      // indirect eval: evaluates at global scope so `var Module/FS/callMain` become globals
      ;(0, eval)(glue)
    })
    return new VgmstreamDecoder(global)
  }

  /**
   * Wraps an already initialized Emscripten module (offline tests)
   */
  public static fromGlobal(global: any) {
    return new VgmstreamDecoder(global)
  }

  /**
   * Decodes a `.wem` (or any vgmstream supported) file to planar float channels
   */
  public decode(data: Uint8Array): { sampleRate: number; channels: Float32Array[] } {
    return parseWav(this.decodeWav(data))
  }

  /**
   * Decodes a `.wem` (or any vgmstream supported) file to the RIFF WAVE file vgmstream writes (16 bit PCM)
   */
  public decodeWav(data: Uint8Array): Uint8Array {
    const fs = this.global.FS
    const id = ++this.counter
    const input = `/in${id}.wem`
    const output = `/out${id}.wav`
    fs.writeFile(input, data)
    try {
      this.global.callMain(['-o', output, input])
      try {
        return fs.readFile(output)
      } catch {
        throw new Error('vgmstream produced no output (unsupported media)')
      }
    } finally {
      try {
        fs.unlink(input)
      } catch {}
      try {
        fs.unlink(output)
      } catch {}
    }
  }
}

/**
 * Parses a PCM (16 bit) or IEEE float (32 bit) RIFF WAVE into planar channels
 */
export function parseWav(wav: Uint8Array): { sampleRate: number; channels: Float32Array[] } {
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength)
  const tag = (o: number) => String.fromCharCode(wav[o], wav[o + 1], wav[o + 2], wav[o + 3])
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    throw new Error('not a RIFF WAVE')
  }
  let offset = 12
  let format = 0
  let channelCount = 0
  let sampleRate = 0
  let bits = 0
  while (offset + 8 <= wav.byteLength) {
    const id = tag(offset)
    const size = view.getUint32(offset + 4, true)
    const body = offset + 8
    if (id === 'fmt ') {
      format = view.getUint16(body, true)
      channelCount = view.getUint16(body + 2, true)
      sampleRate = view.getUint32(body + 4, true)
      bits = view.getUint16(body + 14, true)
      if (format === 0xfffe && size >= 26) {
        format = view.getUint16(body + 24, true) // extensible sub format
      }
    } else if (id === 'data') {
      const bytesPerSample = bits / 8
      const frames = Math.floor(Math.min(size, wav.byteLength - body) / (bytesPerSample * channelCount))
      const channels = Array.from({ length: channelCount }, () => new Float32Array(frames))
      if (format === 1 && bits === 16) {
        for (let f = 0, p = body; f < frames; f++) {
          for (let c = 0; c < channelCount; c++, p += 2) {
            channels[c][f] = view.getInt16(p, true) / 32768
          }
        }
      } else if (format === 3 && bits === 32) {
        for (let f = 0, p = body; f < frames; f++) {
          for (let c = 0; c < channelCount; c++, p += 4) {
            channels[c][f] = view.getFloat32(p, true)
          }
        }
      } else {
        throw new Error(`unsupported wav format ${format} with ${bits} bits`)
      }
      return { sampleRate, channels }
    }
    offset = body + size + (size & 1)
  }
  throw new Error('wav has no data chunk')
}
