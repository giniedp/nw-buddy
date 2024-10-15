module.exports = ({ addComponents }) => {
  addComponents({
    '.is-embed': {
      '.embed-hidden': {
        display: 'none !important;',
      },
    },
    '.nw-bg-pane': {
      background: `url('assets/bg-pane.jpg') black`,
    },
    '.nw-bg-title': {
      background: `url('assets/bg-title.png')`,
      backgroundRepeat: 'no-repeat',
    },
    '.nw-bg-crafting-rune': {
      background: `url('assets/loaders/crafting_rune_clockwise.png')`,
    },
    '.nw-item-frame': {
      border: '10px solid transparent',
      borderImageWidth: '10px',
      borderImageRepeat: 'stretch',
      borderImageSlice: '17',
      borderImageSource: `url('assets/icons/item/frame-bg.png')`,
    },
    '.nw-item-frame-content': {
      border: '1px solid transparent',
      borderImageWidth: '2px',
      borderImageRepeat: 'stretch',
      borderImageSlice: '2',
      borderImageSource: `url('assets/icons/item/frame-border.png')`,
      backgroundColor: 'black',
    },
    '.nw-item-divider': {
      opacity: 0.25,
      borderWidth: 0,
      backgroundImage: `url('assets/icons/item/frame-divider.png')`,
      backgroundRepeat: 'repeat-x',
      height: '1px',
      '&.masked': {
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      },
    },
    '.nw-item-section:not(.hidden):not(:empty) ~ .nw-item-section': {
      marginTop: '8px',
      paddingTop: '8px',
      '&::before': {
        position: 'relative',
        top: '-8px',
        content: '""',
        display: 'block',
        height: '1px',
        backgroundImage: `url('assets/icons/item/frame-divider.png')`,
        backgroundRepeat: 'repeat-x',
        opacity: 0.25,
        borderWidth: 0,
      },
    },
    '.nw-item-header': {
      position: 'relative',
      '> *': {
        position: 'relative',
      },
    },
    '.nw-item-header-bg': {
      background: `var(--rarity-bg-head, url('assets/icons/item/tooltip_header_bg_0.png')) var(--rarity-c1)`,
      backgroundPosition: '50% 50%',
      backgroundSize: 'cover',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    '.nw-item-header-fg': {
      backgroundImage: 'var(--rarity-bg-ani)',
      backgroundPosition: '50% 90%',
      backgroundSize: 'cover',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    '.nw-item-icon-frame': {
      display: 'block',
      position: 'relative',
    },
    '.nw-item-icon-border': {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      border: '1px solid transparent',
      background: 'linear-gradient(to bottom, var(--rarity-c0, #c8c8c8), var(--rarity-c1, #a1a1a1)) border-box',
      '-webkit-mask': 'linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0)',
      '-webkit-mask-composite': 'xor',
      mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
      maskComposite: 'exclude',
    },
    '.nw-item-icon-bg': {
      backgroundImage: `var(--rarity-bg, url('assets/icons/item/itemraritybgsquare0.png'))`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
    },
    '.nw-item-icon-mask': {
      backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
    },
    '.nw-item-rarity-common': {
      '--rarity-c0': '#dddddd',
      '--rarity-c1': '#666666',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquare0.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_0.png')`,
    },
    '.nw-item-rarity-uncommon': {
      '--rarity-c0': '#34ec5b',
      '--rarity-c1': '#00ab1a',
      '--rarity-c3': '#00ab1a',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquare1.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_1.png')`,
      '&.named': {
        '--rarity-bg': `url('assets/icons/item/itemraritybgsquarenamed1.png')`,
        '--rarity-bg-ani': `url('assets/icons/item/named_bg_1.webp')`,
      },
    },
    '.nw-item-rarity-rare': {
      '--rarity-c0': '#72ffff',
      '--rarity-c1': '#31bdeb',
      '--rarity-c3': '#31bdeb',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquare2.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_2.png')`,
      '&.named': {
        '--rarity-bg': `url('assets/icons/item/itemraritybgsquarenamed2.png')`,
        '--rarity-bg-ani': `url('assets/icons/item/named_bg_2.webp')`,
      },
    },
    '.nw-item-rarity-epic': {
      '--rarity-c0': '#ff57ff',
      '--rarity-c1': '#e600de',
      '--rarity-c3': '#e600de',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquare3.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_3.png')`,
      '&.named': {
        '--rarity-bg': `url('assets/icons/item/itemraritybgsquarenamed3.png')`,
        '--rarity-bg-ani': `url('assets/icons/item/named_bg_3.webp')`,
      },
    },
    '.nw-item-rarity-legendary': {
      '--rarity-c0': '#ffa535',
      '--rarity-c1': '#f07808',
      '--rarity-c3': '#f07808',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquare4.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_4.png')`,
      '&.named': {
        '--rarity-bg': `url('assets/icons/item/itemraritybgsquarenamed4.png')`,
        '--rarity-bg-ani': `url('assets/icons/item/named_bg_4.webp')`,
      },
    },
    '.nw-item-rarity-artifact': {
      '--rarity-c0': '#ff7c55',
      '--rarity-c1': '#b42e0a',
      '--rarity-c3': '#b42e0a',
      '--rarity-bg': `url('assets/icons/item/itemraritybgsquareartifact.png')`,
      '--rarity-bg-head': `url('assets/icons/item/tooltip_header_bg_artifact.png')`,
      '--rarity-bg-ani': `url('assets/icons/item/artifact_bg.webp')`,
    },
    '.nw-status-bg': {
      maskImage: `url('assets/icons/abilities/statuseffectbg.png')`,
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      backgroundColor: 'rgba(0, 0, 0, 1)',
      '&.negative': {
        backgroundColor: 'rgba(255, 0, 0, 1)',
      },
    },
  })
}
