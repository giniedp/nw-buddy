import { Meta, StoryObj } from '@storybook/angular'

export default {
  title: 'CSS',
  tags: ['autodocs'],
} satisfies Meta

export const NwBgPane: StoryObj = {
  name: '.nw-bg-pane',
  render: () => {
    return {
      template: `
        <div class="nw-bg-pane bg-cover w-96 aspect-square">

        </div>
      `,
    }
  },
}

export const NwBgTitle: StoryObj = {
  name: '.nw-bg-title',
  render: () => {
    return {
      template: `
        <h3 class="nw-bg-title bg-bottom text-lg uppercase text-center ">
          Hello World
        </h3>
      `,
    }
  },
}

export const NwBgCraftingRune: StoryObj = {
  name: '.nw-bg-crafting-rune',
  render: () => {
    return {
      template: `
      <div class="nw-bg-crafting-rune bg-cover w-96 aspect-square">

      </div>
      `,
    }
  },
}

export const NwItemIconFrame: StoryObj = {
  name: '.nw-item-icon-frame',
  render: () => {
    return {
      template: `
        <div class="nw-item-icon-frame nw-item-icon-bg w-12 aspect-square">
          <div class="nw-item-icon-border"></div>
        </div>
        <div class="nw-item-icon-frame nw-item-icon-bg nw-item-rarity-uncommon w-12 aspect-square">
          <div class="nw-item-icon-border "></div>
        </div>
        <div class="nw-item-icon-frame nw-item-icon-bg nw-item-rarity-rare w-12 aspect-square">
          <div class="nw-item-icon-border "></div>
        </div>
        <div class="nw-item-icon-frame nw-item-icon-bg nw-item-rarity-epic w-12 aspect-square">
          <div class="nw-item-icon-border "></div>
        </div>
        <div class="nw-item-icon-frame nw-item-icon-bg nw-item-rarity-legendary w-12 aspect-square">
          <div class="nw-item-icon-border "></div>
        </div>
        <div class="nw-item-icon-frame nw-item-icon-bg nw-item-rarity-artifact w-12 aspect-square">
          <div class="nw-item-icon-border "></div>
        </div>
      `,
    }
  },
}
