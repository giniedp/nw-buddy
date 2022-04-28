import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class TradeskillsService {

  public readonly categories = {
    Crafting: [
      'Weaponsmithing',
      'Armoring',
      'Engineering',
      'Jewelcrafting',
      'Arcana',
      'Cooking',
      'Furnishing',
    ],
    Refining: [
      'Smelting',
      'Woodworking',
      'Leatherworking',
      'Weaving',
      'Stonecutting',
    ],
    Gathering: [
      'Logging',
      'Mining',
      'Fishing',
      'Harvesting',
      'Skinning',
    ]
  }
  public readonly categoryNames = Array.from(Object.keys(this.categories))
}
