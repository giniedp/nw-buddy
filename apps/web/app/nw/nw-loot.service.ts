import { Injectable } from "@angular/core"
import { Housingitems, ItemDefinitionMaster } from "@nw-data/types";
import { map, Observable } from "rxjs";
import { NwLootbucketService } from "./nw-lootbucket.service";
import { LootBucketEntry } from "./utils";

@Injectable({ providedIn: 'root' })
export class LootService {

  public constructor(private buckets: NwLootbucketService) {
    //
  }
}
