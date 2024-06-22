import * as cp from 'child_process'
import { logger } from './logger'

export async function spawn(cmd: string, args?: string[], options?: cp.SpawnOptions) {
  logger.activity('spawn', cmd, ...args)

  return new Promise<void>((resolve, reject) => {
    const p = cp.spawn(cmd, args, options)
    if (p.stdout) {
      console.log('listening')
      p.stdout.on('data', (data) => {
        logger.log(`${data}`.replace(/\n$/, ''))
      })
      p.stderr.on('data', (data) => {
        logger.log(`${data}`.replace(/\n$/, ''))
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
