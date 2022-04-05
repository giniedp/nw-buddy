import * as cp from 'child_process'

export async function spawn(cmd: string, options?: cp.SpawnOptions) {
  return new Promise<void>((resolve, reject) => {
    const p = cp.spawn(cmd, options)
    const stderr = []
    const stdout = []
    p.stderr.on('data', (data) => {
      stderr.push(data.toString())
    })
    p.stdout.on('data', (data) => {
      stdout.push(data.toString())
    })
    p.on('close', (code, signal) => {
      if (code) {
        reject(stderr.length ? stderr.join('\n') : stdout.join('\n'))
      } else {
        resolve()
      }
    })
  })
}
