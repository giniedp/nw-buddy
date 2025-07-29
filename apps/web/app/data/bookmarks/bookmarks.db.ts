import { injectAppDB } from '../db'
import { DBT_BOOKMARKS } from './constants'
import { BookmarkRecord } from './types'

export type BookmarksDB = ReturnType<typeof injectBookmarksDB>
export function injectBookmarksDB() {
  return injectAppDB().table<BookmarkRecord>(DBT_BOOKMARKS)
}
