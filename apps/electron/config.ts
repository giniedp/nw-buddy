import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { WindowState } from './window-state'

const filePath = path.join(app.getPath('userData'), 'config.json')

export interface Config {
  window?: Partial<WindowState>
}

export function loadConfig(): Config {
  try {
    return JSON.parse(fs.readFileSync(filePath).toString())
  } catch (e) {
    //
  }
  return {}
}

export function writeConfig(config: Config) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  } catch (e) {
    //
  }
}
