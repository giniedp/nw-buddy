import { injectAppDB } from '../db'
import { DBT_IMAGES } from './constants'
import { ImageRecord } from './types'

export type ImagesDB = ReturnType<typeof injectImagesDB>
export function injectImagesDB() {
  return injectAppDB().table<ImageRecord>(DBT_IMAGES)
}
