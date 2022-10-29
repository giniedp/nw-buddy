import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { sortBy } from 'lodash'

export const LINKS = [
  {
    name: 'New World Database',
    description:
      'New World Database contains all the information about items, quests, crafting recipes, perks, abilities, population numbers and much more',
    url: 'https://nwdb.info',
  },
  {
    name: 'New World Tools',
    description:
      "Damage calculator for New World. Try out item, stat, and mastery combinations and see how much you'd be hitting for.",
    url: 'https://www.nw-tools.info',
  },
  {
    name: 'gaming.tools',
    image: 'https://gaming.tools/newworld/images/trade-skills/armoring.png',
    description:
      'Find the best crafting options to level up your trade skills, and most optimized crafting calculators for all craftable items in New World.',
    url: 'https://gaming.tools/newworld',
  },
  {
    name: 'New World Exchange',
    image: 'https://webstatic.ams3.digitaloceanspaces.com/logo512.png',
    description: "New World Exchange is a data analytics website for New World's trading data",
    url: 'https://new-world.exchange',
  },
  {
    name: 'New World Market Prices',
    image: '',
    description: 'Pricing data sourced from our community of Market Watchers.',
    url: 'https://nwmarketprices.com',
  },
  {
    name: 'NewWorldFans.com',
    image: 'https://newworldfans.com/og-card-fallback.jpg',
    description: "Builds, Guides, Database & Tools for Amazon's New World MMO",
    url: 'https://newworldfans.com',
  },
  {
    name: '',
    image: '',
    description: '',
    url: 'https://www.newworld-map.com',
  },
  {
    name: 'New World Interactive Map | Map Genie',
    image: 'https://cdn.mapgenie.io/images/games/new-world/preview.jpg',
    description:
      'New World MMO Map - All Resources, Chests, Lore Documents, Essences, Boss farming spots & more! Use the progress tracker to get 100%!',
    url: 'https://mapgenie.io/new-world',
  },
  {
    name: 'RaidPlan.io',
    image: 'https://raidplan.io/android-chrome-192x192.png',
    description: 'Create and share war plans for New World!',
    url: 'https://raidplan.io/newworld',
  },
  {
    name: 'Aeternum Map',
    image: '',
    description:
      'Interactive New World map  with locations, farming routes, resources, lore documents, chests, mobs, position tracking and more!',
    url: 'https://aeternum-map.gg/',
  },
]

@Component({
  standalone: true,
  selector: 'nwb-links-page',
  templateUrl: './links.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-content flex flex-col items-center',
  },
})
export class LinksComponent {
  protected links = sortBy(LINKS, (it) => it.name || it.url)
}
