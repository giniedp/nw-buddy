module.exports = ({ addComponents }) => {
  addComponents({
    '.nw-item-frame': {
      border: '10px solid transparent',
      borderImageWidth: '10px',
      borderImageRepeat: 'stretch',
      borderImageSlice: '17',
      borderImageSource: "url('^assets/icons/item/frame-bg.png')",
    },
    '.nw-item-frame-content': {
      border: '1px solid transparent',
      borderImageWidth: '2px',
      borderImageRepeat: 'stretch',
      borderImageSlice: '2',
      borderImageSource: "url('^assets/icons/item/frame-border.png')",
      backgroundColor: 'black',
    },
    '.nw-item-divider': {
      opacity: 0.5,
      borderWidth: 0,
      backgroundImage: "url('^assets/icons/item/frame-divider.png')",
      backgroundSize: '100% 100%',
      height: '2px',
      '&.masked': {
        maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
      },
    },
    '.nw-item-header': {
      position: 'relative',
      '> *': {
        position: 'relative',
      }
    },
    '.nw-item-header-bg': {
      backgroundImage: "var(--rarity-bg-head, url('^assets/icons/item/tooltip_header_bg_0.png'))",
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
      border: '1px solid var(--rarity-c0, #c8c8c8)',
      borderImage: 'linear-gradient(to bottom, var(--rarity-c0, #c8c8c8), var(--rarity-c1, #c8c8c8)) 1',
    },
    '.nw-item-icon-bg': {
      backgroundImage: "var(--rarity-bg, url('^assets/icons/item/itemraritybgsquare0.png'))",
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
    },
    '.nw-item-icon-mask': {
      backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
    },
    '.nw-item-rarity-0': {
      '--rarity-c0': '#c8c8c8',
      '--rarity-c1': '#c8c8c8',
      '--rarity-bg': "url('^assets/icons/item/itemraritybgsquare0.png')",
      '--rarity-bg-head': "url('^assets/icons/item/tooltip_header_bg_0.png')",
      '&.named': {
        '--rarity-bg': "url('^assets/icons/item/itemraritybgsquarenamed0.png')",
      },
    },
    '.nw-item-rarity-1': {
      '--rarity-c0': '#94ff8c',
      '--rarity-c1': '#1f8a1b',
      '--rarity-bg': "url('^assets/icons/item/itemraritybgsquare1.png')",
      '--rarity-bg-head': "url('^assets/icons/item/tooltip_header_bg_1.png')",
      '&.named': {
        '--rarity-bg': "url('^assets/icons/item/itemraritybgsquarenamed1.png')",
        '--rarity-bg-ani': "url('^assets/icons/item/named_bg_1.webp')",
      },
    },
    '.nw-item-rarity-2': {
      '--rarity-c0': '#94d9f5',
      '--rarity-c1': '#1b6f8c',
      '--rarity-bg': "url('^assets/icons/item/itemraritybgsquare2.png')",
      '--rarity-bg-head': "url('^assets/icons/item/tooltip_header_bg_2.png')",
      '&.named': {
        '--rarity-bg': "url('^assets/icons/item/itemraritybgsquarenamed2.png')",
        '--rarity-bg-ani': "url('^assets/icons/item/named_bg_2.webp')",
      },
    },
    '.nw-item-rarity-3': {
      '--rarity-c0': '#d7a3ca',
      '--rarity-c1': '#8b2490',
      '--rarity-bg': "url('^assets/icons/item/itemraritybgsquare3.png')",
      '--rarity-bg-head': "url('^assets/icons/item/tooltip_header_bg_3.png')",
      '&.named': {
        '--rarity-bg': "url('^assets/icons/item/itemraritybgsquarenamed3.png')",
        '--rarity-bg-ani': "url('^assets/icons/item/named_bg_3.webp')",
      },
    },
    '.nw-item-rarity-4': {
      '--rarity-c0': '#ffc67b',
      '--rarity-c1': '#8f5623',
      '--rarity-bg': "url('^assets/icons/item/itemraritybgsquare4.png')",
      '--rarity-bg-head': "url('^assets/icons/item/tooltip_header_bg_4.png')",
      '&.named': {
        '--rarity-bg': "url('^assets/icons/item/itemraritybgsquarenamed4.png')",
        '--rarity-bg-ani': "url('^assets/icons/item/named_bg_4.webp')",
      },
    },
  })
}
