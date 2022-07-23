import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { WindowState } from './window-state'

const filePath = path.join(app.getPath('userData'), 'config.json')

export interface Config {
  window?: WindowState
}

export function loadConfig(): Config {
  console.debug('loadConfig', filePath)
  try {
    const data = JSON.parse(fs.readFileSync(filePath).toString())
    console.log(data)
    return data
  } catch (e) {
    console.error(e)
  }
  return {}
}

export function writeConfig(config: Config) {
  console.log('writeConfig', filePath, config)
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  } catch (e) {
    console.error(e)
  }
}
