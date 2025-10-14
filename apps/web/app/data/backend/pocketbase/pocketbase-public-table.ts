import PocketBase, { RecordModel, RecordService } from 'pocketbase'
import { AppDbRecord } from '../../app-db'
import { PublicTable } from '../backend-adapter'

export interface PocketRecord<T extends AppDbRecord> extends RecordModel {
  user: string
  data: T
}

export class PocketbasePublicTable<T extends AppDbRecord> implements PublicTable<T> {
  public readonly name: string
  public readonly collection: RecordService<PocketRecord<T>>

  private rowId(userId: string, id: string) {
    return `${userId}:${id}`
  }

  public constructor(
    protected readonly client: PocketBase,
    name: string,
  ) {
    this.name = name
    this.collection = client.collection(this.name)
  }

  public async page(page: number, perPage: number, options?: { search?: string; tags?: string[]; tagsOperator?: 'AND' | 'OR'; sortBy?: string; sortDirection?: 'asc' | 'desc' }): Promise<T[]> {
    // Build filter expression
    const filters: string[] = []
    
    // Search filter (name or username via relation)
    if (options?.search) {
      const searchTerm = options.search.toLowerCase()
      filters.push(`(data.name ~ "${searchTerm}" || user.username ~ "${searchTerm}" || user.name ~ "${searchTerm}")`)
    }
    
    // Tags filter (match tags with AND/OR operator)
    if (options?.tags && options.tags.length > 0) {
      const operator = options.tagsOperator === 'AND' ? ' && ' : ' || '
      const tagFilters = options.tags.map(tag => `data.tags ?~ "${tag}"`).join(operator)
      filters.push(`(${tagFilters})`)
    }
    
    // Build sort string based on sortBy option and direction
    const direction = options?.sortDirection === 'asc' ? '' : '-'
    let sortString = '-updated' // Default: most recently updated first
    
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'likes':
          sortString = `${direction}likeCount`
          break
        case 'date':
          sortString = `${direction}updated`
          break
        case 'gearscore':
          sortString = `${direction}data.level`
          break
        case 'name':
          sortString = `${direction}data.name`
          break
      }
    }
    
    // Build query options
    const queryOptions: any = {
      expand: 'user',
      fields: '*,expand.user.id,expand.user.username,expand.user.name,expand.user.avatar',
      sort: sortString,
    }
    
    // Only add filter if we have filters
    if (filters.length > 0) {
      queryOptions.filter = filters.join(' && ')
    }
    
    // Try to expand the user relation
    const pageResult = await this.collection.getList(page, perPage, queryOptions)

    // Batch fetch current user's likes for all items on this page
    const currentUserId = this.client.authStore.record?.id
    let userLikedGearsetIds = new Set<string>()
    
    if (currentUserId && pageResult.items.length > 0) {
      const gearsetIds = pageResult.items.map(row => row.id)
      try {
        const likesCollection = this.client.collection('gearset_likes')
        const userLikes = await likesCollection.getFullList({
          filter: `gearset in ('${gearsetIds.join("','")}') && user = '${currentUserId}'`
        })
        userLikedGearsetIds = new Set(userLikes.map(like => like['gearset']))
      } catch {
        // If query fails, just continue with empty set
      }
    }

    // Map data with usernames and avatars from expanded relation
    return pageResult.items.map((row) => {
      const data = row.data as any

      // Check if user was expanded
      if (row.expand && row.expand['user']) {
        const expandedUser = row.expand['user'] as any
        data.username = expandedUser['username'] || expandedUser['name'] || row.user
        
        // Generate avatar URL if avatar exists
        if (expandedUser['avatar']) {
          // getURL needs the collection and id info
          const userRecord = {
            ...expandedUser,
            collectionId: '_pb_users_auth_',
            collectionName: 'users'
          }
          data.avatarUrl = this.client.files.getURL(userRecord, expandedUser['avatar'], { thumb: '64x64' })
        }
      } else {
        // Fallback to truncated user ID if expansion didn't work
        data.username = (row.user as string).substring(0, 12)
      }

      // Get like count from view (server-side computed)
      data.likeCount = row['likeCount'] || 0
      
      // Check if current user has liked this gearset
      data.isLikedByUser = userLikedGearsetIds.has(row.id)

      // Add timestamps from PocketBase record
      data.created = row['created']
      data.updated = row['updated']

      return data
    })
  }

  public async read({ user, id }: { user: string; id: string }): Promise<T> {
    const recordId = this.rowId(user, id)
    const currentUserId = this.client.authStore.record?.id
    
    // Get the base record with user expansion
    const row = await this.collection.getOne(recordId, {
      expand: 'user',
      fields: '*,expand.user.id,expand.user.username,expand.user.name,expand.user.avatar',
    })
    
    const data = row.data as any

    // Map user data from expanded relation
    if (row.expand && row.expand['user']) {
      const expandedUser = row.expand['user'] as any
      data.username = expandedUser['username'] || expandedUser['name'] || user
      
      // Generate avatar URL if avatar exists
      if (expandedUser['avatar']) {
        const userRecord = {
          ...expandedUser,
          collectionId: '_pb_users_auth_',
          collectionName: 'users'
        }
        data.avatarUrl = this.client.files.getURL(userRecord, expandedUser['avatar'], { thumb: '64x64' })
      }
    } else {
      data.username = user.substring(0, 12)
    }

    // Get like count from view (server-side computed)
    data.likeCount = row['likeCount'] || 0
    
    // Check if current user has liked (only if signed in)
    if (currentUserId) {
      try {
        const likesCollection = this.client.collection('gearset_likes')
        const userLike = await likesCollection.getFirstListItem(
          `user = "${currentUserId}" && gearset = "${recordId}"`
        )
        data.isLikedByUser = !!userLike
      } catch {
        data.isLikedByUser = false
      }
    } else {
      data.isLikedByUser = false
    }

    // Add timestamps from PocketBase record
    data.created = row['created']
    data.updated = row['updated']

    return data
  }

  public async like({ user, id }: { user: string; id: string }): Promise<void> {
    const currentUserId = this.client.authStore.record?.id
    if (!currentUserId) {
      throw new Error('Must be authenticated to like a build')
    }
    
    const recordId = this.rowId(user, id)
    
    // Create like record in junction table
    await this.client.collection('gearset_likes').create({
      user: currentUserId,
      gearset: recordId,
    })
  }

  public async unlike({ user, id }: { user: string; id: string }): Promise<void> {
    const currentUserId = this.client.authStore.record?.id
    if (!currentUserId) {
      throw new Error('Must be authenticated to unlike a build')
    }
    
    const recordId = this.rowId(user, id)
    
    // Find and delete the like record
    const like = await this.client.collection('gearset_likes').getFirstListItem(
      `user = "${currentUserId}" && gearset = "${recordId}"`
    )
    
    await this.client.collection('gearset_likes').delete(like.id)
  }
}
