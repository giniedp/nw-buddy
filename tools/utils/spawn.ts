import * as cp from 'child_process'

export async function spawn(cmd: string, args?: string[], options?: cp.SpawnOptions) {
  return new Promise<void>((resolve, reject) => {
    const p = cp.spawn(cmd, args, options)
    p.on('close', (code) => {
      if (code) {
        reject(code)
      } else {
        resolve()
      }
    })
  })
}
