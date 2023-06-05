import { Objective } from "@nw-data/generated"

export interface FollowUpQuest {
  quest: Objective
  next: FollowUpQuest[]
}
