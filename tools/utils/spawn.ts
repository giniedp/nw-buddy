import * as cp from 'child_process'
import { logger } from './logger'

export async function spawn(cmd: string, args?: string[], options?: cp.SpawnOptions) {
  logger.activity('spawn', cmd, ...args)

  return new Promise<void>((resolve, reject) => {
    const captureOut = options?.stdio === 'inherit'
    if (captureOut) {
      options.stdio = 'ignore'
    }
    const p = cp.spawn(cmd, args, options)
    if (captureOut) {
      p.on('data', (data) => {
        logger.log(data)
      })
      p.on('message', (data) => {

      })
    }
    p.on('close', (code) => {
      if (code) {
        reject(code)
      } else {
        resolve()
      }
    })
  })
}
