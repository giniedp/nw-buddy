import { BookmarkRecord } from '../bookmarks'

export type RemoteBookmarkRecord = {
  user: string
  data: BookmarkRecord
}

export function decodeBookmark(r: RemoteBookmarkRecord): BookmarkRecord {
  return r.data
}

export function encodeBookmark(r: BookmarkRecord): RemoteBookmarkRecord {
  return {
    data: r,
    user: r.userId,
  }
}
