import { ChangeDetectorRef, Directive, HostBinding, Input } from '@angular/core'
import { CraftingRecipeData } from '@nw-data/generated'

@Directive({
  standalone: true,
  selector: '[nwGamingToolsLink]',
})
export class GamingtoolsLinkDirective {
  @Input()
  public set nwGamingToolsLink(value: CraftingRecipeData) {
    this.item = value
    this.update()
  }

  private item: CraftingRecipeData

  @HostBinding('attr.href')
  public href: string

  @HostBinding('attr.target')
  public target: string = '_blank'

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  private update() {
    const category = this.item?.Tradeskill
    const recipeId = this.item?.RecipeID
    if (category && recipeId) {
      this.href = `https://gaming.tools/newworld/crafting-calculators/${category}/${recipeId}`.toLowerCase()
    } else {
      this.href = ''
    }
    this.cdRef.markForCheck()
  }
}
