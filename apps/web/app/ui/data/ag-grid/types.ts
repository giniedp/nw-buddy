import { AgGridEvent, AgPublicEventType, AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

// since v33 every feature is a module of its own (filters, tooltips, csv export, pinned rows, ...)
ModuleRegistry.registerModules([AllCommunityModule])

export type AgGrid<T = any, C = any> = Pick<AgGridEvent<T, C>, 'api' | 'context'>
export type AgGridEvents = AgPublicEventType
