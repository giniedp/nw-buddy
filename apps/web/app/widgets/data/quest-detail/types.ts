import { Objectives } from '@nw-data/generated'

export interface FollowUpQuest {
  quest: Objectives
  next: FollowUpQuest[]
}
