export const WEB3TOKEN_KEY = 'web3token' as const
export const IPNSKEY_KEY = 'ipnsKey' as const
export const IPNSNAME_KEY = 'ipnsName' as const
export const SENSITIVE_KEYS = [WEB3TOKEN_KEY, IPNSKEY_KEY, IPNSNAME_KEY]
export const PREFERENCES_PREFIX = 'nwb:'
export const PREFERENCES_DB_KEY = 'db:nw-buddy'
export const DATABASE_NAME = 'nw-buddy'
export const LOCAL_USER_ID = 'local' as const
export { DBT_BOOKMARKS } from './bookmarks/constants'
export { DBT_CHARACTERS } from './characters/constants'
export { DBT_GEARSETS } from './gearsets/constants'
export { DBT_ITEMS } from './items/constants'
export { DBT_SKILL_TREES } from './skill-tree/constants'
export { DBT_TABLE_PRESETS, DBT_TABLE_STATES } from './table-presets/constants'
export { DBT_TRANSMOGS } from './transmogs/constants'
